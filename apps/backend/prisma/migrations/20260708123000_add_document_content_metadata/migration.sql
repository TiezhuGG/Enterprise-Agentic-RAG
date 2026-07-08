ALTER TABLE "document_contents"
ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
