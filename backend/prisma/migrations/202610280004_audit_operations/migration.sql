BEGIN;
-- CreateTable
CREATE TABLE "audit_record" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_kind" TEXT NOT NULL,
    "operator_identity" TEXT,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "action_code" TEXT NOT NULL,
    "object_kind" TEXT NOT NULL,
    "object_id" UUID,
    "season_id" UUID,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "before_data" JSONB,
    "after_data" JSONB,
    "request_id" UUID,

    CONSTRAINT "audit_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "command_receipt" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "action_code" TEXT NOT NULL,
    "request_key" UUID NOT NULL,
    "content_digest" TEXT NOT NULL,
    "outcome_state" TEXT NOT NULL,
    "response_status" INTEGER,
    "response_data" JSONB,
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "command_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_guard" (
    "key" TEXT NOT NULL,

    CONSTRAINT "system_guard_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "maintenance_state" (
    "singleton_id" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "operation_id" UUID,
    "changed_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "maintenance_state_pkey" PRIMARY KEY ("singleton_id")
);

-- CreateIndex
CREATE INDEX "audit_record_occurred_at_id_idx" ON "audit_record"("occurred_at" DESC, "id");

-- CreateIndex
CREATE INDEX "audit_record_actor_id_occurred_at_idx" ON "audit_record"("actor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_record_action_code_occurred_at_idx" ON "audit_record"("action_code", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_record_object_kind_object_id_occurred_at_idx" ON "audit_record"("object_kind", "object_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_record_season_id_occurred_at_idx" ON "audit_record"("season_id", "occurred_at");

-- CreateIndex
CREATE INDEX "command_receipt_expires_at_idx" ON "command_receipt"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "command_receipt_account_id_action_code_request_key_key" ON "command_receipt"("account_id", "action_code", "request_key");

-- AddForeignKey
ALTER TABLE "audit_record" ADD CONSTRAINT "audit_record_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_record" ADD CONSTRAINT "audit_record_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command_receipt" ADD CONSTRAINT "command_receipt_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- C12-C14. Technical rows only; no account or operational Season seeds.
ALTER TABLE audit_record
 ADD CONSTRAINT audit_actor_kind CHECK (actor_kind IN ('ACCOUNT','OPERATOR','SYSTEM')),
 ADD CONSTRAINT audit_actor_context CHECK (
  (actor_kind='ACCOUNT' AND actor_id IS NOT NULL AND operator_identity IS NULL) OR
  (actor_kind='OPERATOR' AND actor_id IS NULL AND operator_identity IS NOT NULL AND char_length(operator_identity) BETWEEN 1 AND 200) OR
  (actor_kind='SYSTEM' AND actor_id IS NULL AND operator_identity IS NULL)),
 ADD CONSTRAINT audit_reason CHECK (char_length(reason) <= 2000);
ALTER TABLE command_receipt
 ADD CONSTRAINT receipt_uuid CHECK (request_key::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
 ADD CONSTRAINT receipt_digest CHECK (content_digest ~ '^[0-9a-f]{64}$'),
 ADD CONSTRAINT receipt_outcome CHECK (
  (outcome_state='PENDING' AND completed_at IS NULL AND expires_at IS NULL AND response_status IS NULL AND response_data IS NULL) OR
  (outcome_state='COMPLETED' AND completed_at IS NOT NULL AND expires_at IS NOT NULL AND expires_at=completed_at+interval '24 hours' AND response_status IS NOT NULL AND response_status BETWEEN 200 AND 599 AND response_data IS NOT NULL));
ALTER TABLE maintenance_state ADD CONSTRAINT maintenance_singleton CHECK (singleton_id=1);
INSERT INTO system_guard(key) VALUES ('bootstrap'),('last-active-admin'),('maintenance-admission');
INSERT INTO maintenance_state(singleton_id,closed,changed_at) VALUES (1,false,clock_timestamp());
CREATE FUNCTION preserve_audit_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit history is append-only' USING ERRCODE='23514'; END $$;
CREATE TRIGGER audit_history BEFORE UPDATE OR DELETE ON audit_record FOR EACH ROW EXECUTE FUNCTION preserve_audit_history();

COMMIT;
