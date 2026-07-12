ALTER TABLE "users"
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "knowledge_spaces"
ADD COLUMN "department_id" TEXT;

UPDATE "knowledge_spaces" AS "space"
SET "department_id" = "department"."id"
FROM "departments" AS "department"
WHERE "space"."tenant_id" = "department"."tenant_id"
  AND "space"."metadata"->>'departmentId' IS NOT NULL
  AND (
    "space"."metadata"->>'departmentId' = "department"."id"
    OR "space"."metadata"->>'departmentId' = "department"."code"
  );

CREATE INDEX "knowledge_spaces_department_id_idx" ON "knowledge_spaces"("department_id");

ALTER TABLE "knowledge_spaces"
ADD CONSTRAINT "knowledge_spaces_department_id_fkey"
FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "governance_audit_events" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT,
  "actor_user_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "governance_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "governance_audit_events_tenant_id_created_at_idx"
ON "governance_audit_events"("tenant_id", "created_at");

CREATE INDEX "governance_audit_events_target_type_target_id_created_at_idx"
ON "governance_audit_events"("target_type", "target_id", "created_at");

ALTER TABLE "governance_audit_events"
ADD CONSTRAINT "governance_audit_events_actor_user_id_fkey"
FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "governance_audit_events"
ADD CONSTRAINT "governance_audit_events_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
