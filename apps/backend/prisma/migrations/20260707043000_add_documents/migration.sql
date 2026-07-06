CREATE TYPE "DocumentType" AS ENUM ('PDF', 'WORD', 'TXT', 'MARKDOWN', 'IMAGE', 'AUDIO', 'VIDEO');

CREATE TYPE "DocumentStatus" AS ENUM ('CREATED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'CREATED',
    "storage_key" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_space_id_idx" ON "documents"("space_id");
CREATE INDEX "documents_created_by_idx" ON "documents"("created_by");
CREATE INDEX "documents_status_idx" ON "documents"("status");

ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_space_id_fkey"
    FOREIGN KEY ("space_id") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
