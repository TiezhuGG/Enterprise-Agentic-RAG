CREATE TYPE "PipelineJobStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

CREATE TYPE "PipelineEventStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'SKIPPED');

CREATE TABLE "pipeline_jobs" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "execution_id" TEXT,
    "request_id" TEXT,
    "triggered_by" TEXT,
    "status" "PipelineJobStatus" NOT NULL DEFAULT 'RUNNING',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pipeline_events" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" "PipelineEventStatus" NOT NULL,
    "duration_ms" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pipeline_jobs_document_id_created_at_idx" ON "pipeline_jobs"("document_id", "created_at");
CREATE INDEX "pipeline_jobs_space_id_created_at_idx" ON "pipeline_jobs"("space_id", "created_at");
CREATE INDEX "pipeline_jobs_execution_id_idx" ON "pipeline_jobs"("execution_id");
CREATE INDEX "pipeline_jobs_status_idx" ON "pipeline_jobs"("status");

CREATE INDEX "pipeline_events_job_id_created_at_idx" ON "pipeline_events"("job_id", "created_at");
CREATE INDEX "pipeline_events_document_id_created_at_idx" ON "pipeline_events"("document_id", "created_at");
CREATE INDEX "pipeline_events_space_id_created_at_idx" ON "pipeline_events"("space_id", "created_at");
CREATE INDEX "pipeline_events_stage_status_idx" ON "pipeline_events"("stage", "status");

ALTER TABLE "pipeline_jobs" ADD CONSTRAINT "pipeline_jobs_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pipeline_jobs" ADD CONSTRAINT "pipeline_jobs_space_id_fkey"
    FOREIGN KEY ("space_id") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pipeline_events" ADD CONSTRAINT "pipeline_events_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "pipeline_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
