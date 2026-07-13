import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { toAppErrorMessage } from '../../common';
import { ConfigService } from '../../config';
import { PipelineService, type PipelineJobEntity } from '../pipeline';
import { IngestionService } from './ingestion.service';

const pollingIntervalMs = 2000;
const leaseDurationMs = 10 * 60 * 1000;
const leaseHeartbeatMs = 30 * 1000;
const maxAttempts = 3;

@Injectable()
export class IngestionQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionQueueService.name);
  private pollingTimer: NodeJS.Timeout | null = null;
  private processing = false;
  private stopped = false;
  private readonly workerId = `${process.env.HOSTNAME || 'ingestion-worker'}-${process.pid}`;

  constructor(
    private readonly configService: ConfigService,
    private readonly ingestionService: IngestionService,
    private readonly pipelineService: PipelineService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.configService.getAppConfig().ingestionWorkerEnabled) {
      this.logger.log('Ingestion queue worker is disabled for this application instance');
      return;
    }

    const recoveredCount = await this.pipelineService.recoverExpiredLeases();

    if (recoveredCount > 0) {
      this.logger.warn(`Requeued ${recoveredCount} ingestion job(s) with expired worker leases`);
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
      await this.pipelineService.recoverExpiredLeases();
      const job = await this.pipelineService.claimNextQueuedJob(this.workerId, leaseDurationMs);

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
    const leaseHeartbeat = setInterval(() => {
      void this.pipelineService.extendLease(job.id, this.workerId, leaseDurationMs);
    }, leaseHeartbeatMs);

    try {
      await this.ingestionService.runQueuedDocumentIngestion(job);
    } catch (error) {
      const errorMessage = toAppErrorMessage(error, '文档解析失败');

      if (job.attemptCount < maxAttempts) {
        const delayMs = 2 ** Math.max(0, job.attemptCount - 1) * 30_000;
        await this.pipelineService.scheduleRetry(job, delayMs);
        this.logger.warn(`Ingestion job ${job.id} failed and will retry: ${errorMessage}`);
      } else {
        await this.pipelineService.recordStageEvent(job, {
          durationMs: 0,
          errorMessage,
          metadata: {
            attempts: job.attemptCount,
            reason: 'queue-worker-retries-exhausted',
          },
          stage: 'queue-worker',
          status: 'failed',
        });
        await this.pipelineService.finishJob(job.id, 'FAILED');
        this.logger.warn(`Ingestion job ${job.id} failed after ${job.attemptCount} attempts: ${errorMessage}`);
      }
    } finally {
      clearInterval(leaseHeartbeat);
    }
  }
}
