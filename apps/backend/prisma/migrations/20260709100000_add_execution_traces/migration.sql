CREATE TYPE "ExecutionRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TYPE "ExecutionTraceEventStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'SKIPPED');

CREATE TABLE "execution_runs" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "source" TEXT NOT NULL,
    "status" "ExecutionRunStatus" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "execution_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "execution_trace_events" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "node" TEXT,
    "status" "ExecutionTraceEventStatus" NOT NULL,
    "duration_ms" INTEGER,
    "sequence" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_trace_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "execution_runs_execution_id_key" ON "execution_runs"("execution_id");

CREATE UNIQUE INDEX "execution_trace_events_execution_id_sequence_key" ON "execution_trace_events"("execution_id", "sequence");

CREATE INDEX "execution_runs_user_id_created_at_idx" ON "execution_runs"("user_id", "created_at");
CREATE INDEX "execution_runs_conversation_id_created_at_idx" ON "execution_runs"("conversation_id", "created_at");
CREATE INDEX "execution_runs_request_id_idx" ON "execution_runs"("request_id");
CREATE INDEX "execution_runs_status_idx" ON "execution_runs"("status");

CREATE INDEX "execution_trace_events_execution_id_sequence_idx" ON "execution_trace_events"("execution_id", "sequence");
CREATE INDEX "execution_trace_events_user_id_timestamp_idx" ON "execution_trace_events"("user_id", "timestamp");
CREATE INDEX "execution_trace_events_request_id_idx" ON "execution_trace_events"("request_id");
CREATE INDEX "execution_trace_events_type_status_idx" ON "execution_trace_events"("type", "status");

ALTER TABLE "execution_runs" ADD CONSTRAINT "execution_runs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "execution_runs" ADD CONSTRAINT "execution_runs_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "execution_trace_events" ADD CONSTRAINT "execution_trace_events_execution_id_fkey"
    FOREIGN KEY ("execution_id") REFERENCES "execution_runs"("execution_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "execution_trace_events" ADD CONSTRAINT "execution_trace_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
