CREATE TYPE "MultimodalAttachmentType" AS ENUM ('IMAGE', 'AUDIO');

CREATE TYPE "MultimodalAttachmentStatus" AS ENUM ('CREATED', 'EXTRACTED', 'FAILED');

CREATE TABLE "multimodal_attachments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "type" "MultimodalAttachmentType" NOT NULL,
    "status" "MultimodalAttachmentStatus" NOT NULL DEFAULT 'CREATED',
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "extracted_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multimodal_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "multimodal_attachments_user_id_idx" ON "multimodal_attachments"("user_id");
CREATE INDEX "multimodal_attachments_conversation_id_idx" ON "multimodal_attachments"("conversation_id");
CREATE INDEX "multimodal_attachments_status_idx" ON "multimodal_attachments"("status");

ALTER TABLE "multimodal_attachments"
    ADD CONSTRAINT "multimodal_attachments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "multimodal_attachments"
    ADD CONSTRAINT "multimodal_attachments_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
