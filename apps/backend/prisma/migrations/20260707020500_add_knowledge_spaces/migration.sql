CREATE TYPE "KnowledgeSpaceVisibility" AS ENUM ('PRIVATE', 'INTERNAL', 'PUBLIC');

CREATE TYPE "KnowledgeSpaceStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

CREATE TYPE "SpaceMemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

CREATE TABLE "knowledge_spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "KnowledgeSpaceVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "KnowledgeSpaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_spaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "space_members" (
    "space_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "SpaceMemberRole" NOT NULL,

    CONSTRAINT "space_members_pkey" PRIMARY KEY ("space_id","user_id")
);

CREATE INDEX "knowledge_spaces_owner_id_idx" ON "knowledge_spaces"("owner_id");
CREATE INDEX "space_members_user_id_idx" ON "space_members"("user_id");

ALTER TABLE "knowledge_spaces" ADD CONSTRAINT "knowledge_spaces_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "space_members" ADD CONSTRAINT "space_members_space_id_fkey"
    FOREIGN KEY ("space_id") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "space_members" ADD CONSTRAINT "space_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
