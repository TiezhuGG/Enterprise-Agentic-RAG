ALTER TABLE "documents" ADD COLUMN "category_id" TEXT;

CREATE TABLE "document_categories" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "parent_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_tags" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_tag_assignments" (
    "document_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_tag_assignments_pkey" PRIMARY KEY ("document_id","tag_id")
);

CREATE UNIQUE INDEX "document_categories_space_id_name_key"
    ON "document_categories"("space_id", "name");

CREATE INDEX "document_categories_space_id_idx"
    ON "document_categories"("space_id");

CREATE INDEX "document_categories_parent_id_idx"
    ON "document_categories"("parent_id");

CREATE UNIQUE INDEX "document_tags_space_id_name_key"
    ON "document_tags"("space_id", "name");

CREATE INDEX "document_tags_space_id_idx"
    ON "document_tags"("space_id");

CREATE INDEX "document_tag_assignments_tag_id_idx"
    ON "document_tag_assignments"("tag_id");

CREATE INDEX "documents_category_id_idx"
    ON "documents"("category_id");

ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_space_id_fkey"
    FOREIGN KEY ("space_id") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_space_id_fkey"
    FOREIGN KEY ("space_id") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "document_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
