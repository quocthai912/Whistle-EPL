BEGIN;
-- CreateTable
CREATE TABLE "season" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_role_assignment" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "role_code" TEXT NOT NULL,
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "system_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_role_assignment" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "role_code" TEXT NOT NULL,
    "granted_by" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "season_role_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_master_grant" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "master_kind" TEXT NOT NULL,
    "granted_by" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL,
    "ended_at" TIMESTAMPTZ(6),
    "end_reason" TEXT,

    CONSTRAINT "shared_master_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "create_season_grant" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "granted_by" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "create_season_grant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "season_code_key" ON "season"("code");

-- CreateIndex
CREATE INDEX "system_role_assignment_account_id_idx" ON "system_role_assignment"("account_id");

-- CreateIndex
CREATE INDEX "system_role_assignment_granted_by_idx" ON "system_role_assignment"("granted_by");

-- CreateIndex
CREATE INDEX "season_role_assignment_account_id_season_id_idx" ON "season_role_assignment"("account_id", "season_id");

-- CreateIndex
CREATE INDEX "season_role_assignment_season_id_idx" ON "season_role_assignment"("season_id");

-- CreateIndex
CREATE INDEX "season_role_assignment_granted_by_idx" ON "season_role_assignment"("granted_by");

-- CreateIndex
CREATE INDEX "shared_master_grant_account_id_idx" ON "shared_master_grant"("account_id");

-- CreateIndex
CREATE INDEX "shared_master_grant_granted_by_idx" ON "shared_master_grant"("granted_by");

-- CreateIndex
CREATE INDEX "create_season_grant_account_id_idx" ON "create_season_grant"("account_id");

-- CreateIndex
CREATE INDEX "create_season_grant_granted_by_idx" ON "create_season_grant"("granted_by");

-- AddForeignKey
ALTER TABLE "system_role_assignment" ADD CONSTRAINT "system_role_assignment_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_role_assignment" ADD CONSTRAINT "system_role_assignment_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_role_assignment" ADD CONSTRAINT "season_role_assignment_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_role_assignment" ADD CONSTRAINT "season_role_assignment_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_role_assignment" ADD CONSTRAINT "season_role_assignment_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_master_grant" ADD CONSTRAINT "shared_master_grant_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_master_grant" ADD CONSTRAINT "shared_master_grant_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "create_season_grant" ADD CONSTRAINT "create_season_grant_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "create_season_grant" ADD CONSTRAINT "create_season_grant_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- C06-C08. Historical assignments remain available after revocation.
ALTER TABLE season
 ADD CONSTRAINT season_code CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
 ADD CONSTRAINT season_name CHECK (char_length(name) BETWEEN 1 AND 200),
 ADD CONSTRAINT season_dates CHECK (start_date <= end_date),
 ADD CONSTRAINT season_state CHECK (state IN ('OPEN','CLOSED')),
 ADD CONSTRAINT season_revision CHECK (revision > 0);
ALTER TABLE system_role_assignment ADD CONSTRAINT system_role_code CHECK (role_code = 'SYSTEM_ADMINISTRATOR');
ALTER TABLE season_role_assignment ADD CONSTRAINT season_role_code CHECK (role_code IN ('SEASON_MANAGER','REGISTRATION_OFFICER','SCHEDULING_OFFICER','RESULTS_OFFICER'));
ALTER TABLE shared_master_grant
 ADD CONSTRAINT shared_master_kind CHECK (master_kind IN ('CLUB_MASTER','PLAYER_MASTER','STADIUM_MASTER')),
 ADD CONSTRAINT shared_end_reason CHECK (char_length(end_reason) <= 2000);
CREATE UNIQUE INDEX system_role_live ON system_role_assignment(account_id,role_code) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX season_role_live ON season_role_assignment(account_id,season_id,role_code) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX shared_grant_live ON shared_master_grant(account_id,master_kind) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX create_season_live ON create_season_grant(account_id) WHERE revoked_at IS NULL;

COMMIT;
