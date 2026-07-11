CREATE TYPE "KnowledgeSpaceType" AS ENUM ('GENERAL', 'DEPARTMENT', 'PROJECT', 'CUSTOMER');

ALTER TABLE "knowledge_spaces"
ADD COLUMN "type" "KnowledgeSpaceType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "knowledge_spaces_type_idx" ON "knowledge_spaces"("type");
