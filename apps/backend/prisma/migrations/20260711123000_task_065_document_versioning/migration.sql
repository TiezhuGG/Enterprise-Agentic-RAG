CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'CREATED',
    "storage_key" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "source_hash" TEXT,
    "content_hash" TEXT,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

INSERT INTO "document_versions" (
    "id",
    "document_id",
    "version_number",
    "title",
    "description",
    "type",
    "status",
    "storage_key",
    "mime_type",
    "size",
    "source_hash",
    "content_hash",
    "is_current",
    "metadata",
    "created_by",
    "created_at",
    "updated_at"
)
SELECT
    'docver_' || "documents"."id",
    "documents"."id",
    1,
    "documents"."title",
    "documents"."description",
    "documents"."type",
    "documents"."status",
    "documents"."storage_key",
    "documents"."mime_type",
    "documents"."size",
    "document_contents"."metadata"->>'sourceHash',
    "document_contents"."metadata"->>'contentHash',
    true,
    jsonb_build_object('backfilled', true),
    "documents"."created_by",
    "documents"."created_at",
    "documents"."updated_at"
FROM "documents"
LEFT JOIN "document_contents"
    ON "document_contents"."document_id" = "documents"."id";

CREATE UNIQUE INDEX "document_versions_document_id_version_number_key"
    ON "document_versions"("document_id", "version_number");

CREATE INDEX "document_versions_document_id_is_current_idx"
    ON "document_versions"("document_id", "is_current");

CREATE INDEX "document_versions_created_by_idx"
    ON "document_versions"("created_by");

CREATE INDEX "document_versions_status_idx"
    ON "document_versions"("status");

ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
