import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { toAppErrorMessage } from '../../common';
import { PipelineService, type PipelineJobEntity } from '../pipeline';
import { IngestionService } from './ingestion.service';

const pollingIntervalMs = 2000;
const restartAbortMessage = '服务重启，任务已中止，请重新解析';

@Injectable()
export class IngestionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionQueueService.name);
  private pollingTimer: NodeJS.Timeout | null = null;
  private processing = false;
  private stopped = false;

  constructor(
    private readonly ingestionService: IngestionService,
    private readonly pipelineService: PipelineService,
  ) {}

  async onModuleInit(): Promise<void> {
    const failedCount = await this.pipelineService.failStaleAsyncRunningJobs(restartAbortMessage);

    if (failedCount > 0) {
      this.logger.warn(`Marked ${failedCount} stale ingestion job(s) as failed after restart`);
    }

    this.pollingTimer = setInterval(() => {
      void this.tick();
    }, pollingIntervalMs);

    void this.tick();
  }

  onModuleDestroy(): void {
    this.stopped = true;

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.processing || this.stopped) {
      return;
    }

    this.processing = true;

    try {
      const job = await this.pipelineService.claimNextQueuedJob();

      if (job) {
        await this.processJob(job);
      }
    } catch (error) {
      this.logger.error(
        `Failed to poll ingestion queue: ${toAppErrorMessage(error, '入库队列轮询失败')}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.processing = false;
    }
  }

  private async processJob(job: PipelineJobEntity): Promise<void> {
    try {
      await this.ingestionService.runQueuedDocumentIngestion(job);
    } catch (error) {
      const errorMessage = toAppErrorMessage(error, '文档解析失败');

      await this.pipelineService.recordStageEvent(job, {
        durationMs: 0,
        errorMessage,
        metadata: {
          reason: 'queue-worker-failed',
        },
        stage: 'queue-worker',
        status: 'failed',
      });
      await this.pipelineService.finishJob(job.id, 'FAILED');
      this.logger.warn(`Ingestion job ${job.id} failed: ${errorMessage}`);
    }
  }
}
