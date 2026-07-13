ALTER TABLE "pipeline_jobs"
  ADD COLUMN IF NOT EXISTS "worker_id" TEXT,
  ADD COLUMN IF NOT EXISTS "lease_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_retry_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "pipeline_jobs_status_next_retry_at_created_at_idx"
  ON "pipeline_jobs"("status", "next_retry_at", "created_at");

CREATE INDEX IF NOT EXISTS "pipeline_jobs_status_lease_expires_at_idx"
  ON "pipeline_jobs"("status", "lease_expires_at");

WITH ranked_active_jobs AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "document_id"
      ORDER BY "updated_at" DESC, "created_at" DESC
    ) AS "row_number"
  FROM "pipeline_jobs"
  WHERE "status" IN ('QUEUED', 'RUNNING')
)
UPDATE "pipeline_jobs"
SET
  "status" = 'CANCELED',
  "finished_at" = NOW(),
  "worker_id" = NULL,
  "lease_expires_at" = NULL,
  "next_retry_at" = NULL
FROM ranked_active_jobs
WHERE "pipeline_jobs"."id" = ranked_active_jobs."id"
  AND ranked_active_jobs."row_number" > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "pipeline_jobs_active_document_unique_idx"
  ON "pipeline_jobs"("document_id")
  WHERE "status" IN ('QUEUED', 'RUNNING');
