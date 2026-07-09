ALTER TYPE "MultimodalAttachmentType" ADD VALUE IF NOT EXISTS 'VIDEO';

ALTER TABLE "multimodal_attachments"
    ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
