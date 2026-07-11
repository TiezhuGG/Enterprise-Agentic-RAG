ALTER TABLE "documents"
ADD COLUMN "access_scope" JSONB NOT NULL DEFAULT '{}';
