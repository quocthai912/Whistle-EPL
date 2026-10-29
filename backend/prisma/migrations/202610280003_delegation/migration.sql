BEGIN;
-- CreateTable
CREATE TABLE "delegation_case" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "proposer_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "current_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegation_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegation_version" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prepared_by" UUID NOT NULL,
    "predecessor_version_id" UUID,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" UUID,
    "decision_reason" TEXT,
    "action_code" TEXT NOT NULL,
    "start_mode" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delegation_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegation_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "delegation_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateTable
CREATE TABLE "delegation_grant" (
    "id" UUID NOT NULL,
    "approved_version_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "action_code" TEXT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "granted_by" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by" UUID,
    "terminated_at" TIMESTAMPTZ(6),
    "reason" TEXT,

    CONSTRAINT "delegation_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegation_boundary" (
    "id" UUID NOT NULL,
    "grant_id" UUID NOT NULL,
    "boundary_kind" TEXT NOT NULL,
    "effective_at" TIMESTAMPTZ(6) NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL,
    "termination_basis" TEXT,

    CONSTRAINT "delegation_boundary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delegation_case_season_id_idx" ON "delegation_case"("season_id");

-- CreateIndex
CREATE INDEX "delegation_case_proposer_id_idx" ON "delegation_case"("proposer_id");

-- CreateIndex
CREATE INDEX "delegation_case_recipient_id_idx" ON "delegation_case"("recipient_id");

-- CreateIndex
CREATE UNIQUE INDEX "delegation_case_id_current_version_id_key" ON "delegation_case"("id", "current_version_id");

-- CreateIndex
CREATE INDEX "delegation_version_prepared_by_idx" ON "delegation_version"("prepared_by");

-- CreateIndex
CREATE INDEX "delegation_version_decided_by_idx" ON "delegation_version"("decided_by");

-- CreateIndex
CREATE UNIQUE INDEX "delegation_version_case_id_version_number_key" ON "delegation_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "delegation_version_case_id_id_key" ON "delegation_version"("case_id", "id");

-- CreateIndex
CREATE INDEX "delegation_version_editor_account_id_idx" ON "delegation_version_editor"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "delegation_grant_approved_version_id_key" ON "delegation_grant"("approved_version_id");

-- CreateIndex
CREATE INDEX "delegation_grant_recipient_id_season_id_action_code_idx" ON "delegation_grant"("recipient_id", "season_id", "action_code");

-- CreateIndex
CREATE INDEX "delegation_grant_season_id_idx" ON "delegation_grant"("season_id");

-- CreateIndex
CREATE INDEX "delegation_grant_granted_by_idx" ON "delegation_grant"("granted_by");

-- CreateIndex
CREATE INDEX "delegation_grant_revoked_by_idx" ON "delegation_grant"("revoked_by");

-- CreateIndex
CREATE UNIQUE INDEX "delegation_boundary_grant_id_boundary_kind_effective_at_key" ON "delegation_boundary"("grant_id", "boundary_kind", "effective_at");

-- AddForeignKey
ALTER TABLE "delegation_case" ADD CONSTRAINT "delegation_case_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_case" ADD CONSTRAINT "delegation_case_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_case" ADD CONSTRAINT "delegation_case_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_case" ADD CONSTRAINT "delegation_case_id_current_version_id_fkey" FOREIGN KEY ("id", "current_version_id") REFERENCES "delegation_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delegation_version" ADD CONSTRAINT "delegation_version_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "delegation_case"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_version" ADD CONSTRAINT "delegation_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_version" ADD CONSTRAINT "delegation_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "delegation_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "delegation_version" ADD CONSTRAINT "delegation_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_version_editor" ADD CONSTRAINT "delegation_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "delegation_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_version_editor" ADD CONSTRAINT "delegation_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_grant" ADD CONSTRAINT "delegation_grant_approved_version_id_fkey" FOREIGN KEY ("approved_version_id") REFERENCES "delegation_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_grant" ADD CONSTRAINT "delegation_grant_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_grant" ADD CONSTRAINT "delegation_grant_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_grant" ADD CONSTRAINT "delegation_grant_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation_boundary" ADD CONSTRAINT "delegation_boundary_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "delegation_grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- C09-C11/C14. Exclusion uses typed copies checked against the approved version.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE delegation_case
 ADD CONSTRAINT delegation_people CHECK (proposer_id <> recipient_id),
 ADD CONSTRAINT delegation_revision CHECK (revision > 0);
ALTER TABLE delegation_version
 ADD CONSTRAINT delegation_version_positive CHECK (version_number > 0),
 ADD CONSTRAINT delegation_state CHECK (state IN ('DRAFT','PENDING','RETURNED','REJECTED','GRANTED','CANCELLED')),
 ADD CONSTRAINT delegation_operation CHECK (action_code IN ('PREPARE_REGULATION_CHANGE','APPROVE_SCHEDULE_ADJUSTMENT','PREPARE_OFFICIAL_RESULT_CORRECTION')),
 ADD CONSTRAINT delegation_start_mode CHECK (start_mode IN ('IMMEDIATE','SCHEDULED')),
 ADD CONSTRAINT delegation_reason CHECK (char_length(reason) <= 2000),
 ADD CONSTRAINT delegation_decision_reason CHECK (char_length(decision_reason) <= 2000),
  ADD CONSTRAINT delegation_submission_state CHECK (state NOT IN ('PENDING','RETURNED','REJECTED','GRANTED') OR submitted_at IS NOT NULL),
  ADD CONSTRAINT delegation_required_decision_reason CHECK (state NOT IN ('RETURNED','REJECTED') OR (decision_reason IS NOT NULL AND btrim(decision_reason) <> '')),
 ADD CONSTRAINT delegation_submitted_complete CHECK (submitted_at IS NULL OR
   (ends_at IS NOT NULL AND reason IS NOT NULL AND btrim(reason) <> '' AND
    ((start_mode = 'IMMEDIATE' AND starts_at IS NULL) OR (start_mode = 'SCHEDULED' AND starts_at IS NOT NULL AND starts_at < ends_at))));
ALTER TABLE delegation_grant
 ADD CONSTRAINT delegation_grant_interval CHECK (starts_at < ends_at),
 ADD CONSTRAINT delegation_grant_reason CHECK (char_length(reason) <= 2000),
 ADD CONSTRAINT delegation_recipient_fk FOREIGN KEY (recipient_id) REFERENCES account(id) ON DELETE RESTRICT,
 ADD CONSTRAINT delegation_no_overlap EXCLUDE USING gist
  (recipient_id WITH =, season_id WITH =, action_code WITH =, tstzrange(starts_at,ends_at,'[)') WITH &&)
  WHERE (revoked_at IS NULL AND terminated_at IS NULL);
ALTER TABLE delegation_boundary
 ADD CONSTRAINT boundary_kind CHECK (boundary_kind IN ('START','EXPIRY','REVOCATION','TERMINATION')),
 ADD CONSTRAINT boundary_processing CHECK (processed_at >= effective_at),
 ADD CONSTRAINT boundary_reason CHECK (char_length(termination_basis) <= 2000);

CREATE FUNCTION preserve_delegation_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.submitted_at IS NOT NULL AND
   (NEW.case_id,NEW.version_number,NEW.prepared_by,NEW.predecessor_version_id,NEW.action_code,NEW.start_mode,NEW.starts_at,NEW.ends_at,NEW.reason,NEW.submitted_at)
    IS DISTINCT FROM
   (OLD.case_id,OLD.version_number,OLD.prepared_by,OLD.predecessor_version_id,OLD.action_code,OLD.start_mode,OLD.starts_at,OLD.ends_at,OLD.reason,OLD.submitted_at) THEN
   RAISE EXCEPTION 'Submitted delegation content is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER delegation_content BEFORE UPDATE ON delegation_version FOR EACH ROW EXECUTE FUNCTION preserve_delegation_content();
CREATE UNIQUE INDEX delegation_one_pending ON delegation_version(case_id) WHERE state='PENDING';

CREATE FUNCTION include_delegation_preparer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO delegation_version_editor(version_id,account_id,first_edited_at)
 VALUES(NEW.id,NEW.prepared_by,NEW.created_at) ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER delegation_preparer AFTER INSERT ON delegation_version FOR EACH ROW EXECUTE FUNCTION include_delegation_preparer();

CREATE FUNCTION preserve_delegation_editors() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Delegation editor history is append-only' USING ERRCODE='23514'; END $$;
CREATE TRIGGER delegation_editor_history BEFORE UPDATE OR DELETE ON delegation_version_editor FOR EACH ROW EXECUTE FUNCTION preserve_delegation_editors();

CREATE FUNCTION preserve_delegation_grant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF (NEW.approved_version_id,NEW.recipient_id,NEW.season_id,NEW.action_code,NEW.starts_at,NEW.ends_at,NEW.granted_by,NEW.granted_at)
  IS DISTINCT FROM (OLD.approved_version_id,OLD.recipient_id,OLD.season_id,OLD.action_code,OLD.starts_at,OLD.ends_at,OLD.granted_by,OLD.granted_at) THEN
  RAISE EXCEPTION 'Granted delegation basis is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER delegation_grant_content BEFORE UPDATE ON delegation_grant FOR EACH ROW EXECUTE FUNCTION preserve_delegation_grant();

CREATE FUNCTION validate_delegation_grant() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v delegation_version; c delegation_case;
BEGIN
 SELECT * INTO STRICT v FROM delegation_version WHERE id=NEW.approved_version_id;
 SELECT * INTO STRICT c FROM delegation_case WHERE id=v.case_id;
 IF v.submitted_at IS NULL OR v.state NOT IN ('PENDING','GRANTED') OR
    (NEW.recipient_id,NEW.season_id,NEW.action_code) IS DISTINCT FROM (c.recipient_id,c.season_id,v.action_code) OR
    NEW.granted_by IN (c.proposer_id,c.recipient_id) OR c.proposer_id=c.recipient_id OR
    (v.start_mode='SCHEDULED' AND NEW.starts_at IS DISTINCT FROM v.starts_at) OR NEW.ends_at IS DISTINCT FROM v.ends_at OR
    (v.start_mode='IMMEDIATE' AND NEW.starts_at IS DISTINCT FROM NEW.granted_at) OR
    EXISTS(SELECT 1 FROM delegation_version_editor WHERE version_id=v.id AND account_id=NEW.granted_by) OR
    NOT EXISTS(SELECT 1 FROM delegation_version_editor WHERE version_id=v.id AND account_id=v.prepared_by) OR
    NOT EXISTS(SELECT 1 FROM season_role_assignment r WHERE r.account_id=c.recipient_id AND r.season_id=c.season_id AND r.revoked_at IS NULL AND
      ((v.action_code='PREPARE_REGULATION_CHANGE' AND r.role_code IN ('REGISTRATION_OFFICER','SCHEDULING_OFFICER','RESULTS_OFFICER')) OR
       (v.action_code='APPROVE_SCHEDULE_ADJUSTMENT' AND r.role_code='SCHEDULING_OFFICER') OR
       (v.action_code='PREPARE_OFFICIAL_RESULT_CORRECTION' AND r.role_code='RESULTS_OFFICER'))) THEN
   RAISE EXCEPTION 'Invalid delegation grant basis' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER delegation_grant_basis BEFORE INSERT ON delegation_grant FOR EACH ROW EXECUTE FUNCTION validate_delegation_grant();

COMMIT;
