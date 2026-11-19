BEGIN;

-- The approved Season name mapping is staged separately before this migration on populated databases.
-- AlterTable
ALTER TABLE "season" ADD COLUMN     "current_regulation_version_id" UUID;

-- CreateTable
CREATE TABLE "regulation_case" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "current_draft_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_version" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prepared_by" UUID NOT NULL,
    "predecessor_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" UUID,
    "decision_reason" TEXT,
    "effective_mode" TEXT,
    "proposed_effective_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "activation_processed_at" TIMESTAMPTZ(6),
    "active_from" TIMESTAMPTZ(6),
    "active_until" TIMESTAMPTZ(6),
    "squad_limit" INTEGER,
    "non_homegrown_limit" INTEGER,
    "homegrown_seasons" INTEGER,
    "homegrown_months" INTEGER,
    "homegrown_age_start" INTEGER,
    "homegrown_age_end" INTEGER,
    "u21_cutoff" DATE,
    "club_count" INTEGER,
    "format_code" TEXT,
    "legs" INTEGER,
    "planned_minutes" INTEGER,
    "preparation_minutes" INTEGER,
    "release_minutes" INTEGER,
    "win_points" INTEGER,
    "draw_points" INTEGER,
    "loss_points" INTEGER,
    "qualification_count" INTEGER,
    "relegation_count" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateTable
CREATE TABLE "registration_window" (
    "id" UUID NOT NULL,
    "regulation_version_id" UUID NOT NULL,
    "intake_kind" TEXT NOT NULL,
    "opens_at" TIMESTAMPTZ(6) NOT NULL,
    "closes_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "registration_window_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_priority" (
    "regulation_version_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "criterion_code" TEXT NOT NULL,

    CONSTRAINT "ranking_priority_pkey" PRIMARY KEY ("regulation_version_id","position")
);

-- CreateTable
CREATE TABLE "goal_type" (
    "id" UUID NOT NULL,
    "regulation_version_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_own_goal" BOOLEAN NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "goal_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_type" (
    "id" UUID NOT NULL,
    "regulation_version_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "card_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_change_request" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_change_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_change_version" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prepared_by" UUID NOT NULL,
    "predecessor_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" UUID,
    "decision_reason" TEXT,
    "action" TEXT NOT NULL,
    "waiting_version_id" UUID NOT NULL,
    "replacement_version_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_change_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_change_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_change_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateTable
CREATE TABLE "season_lifecycle_request" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "current_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_lifecycle_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_lifecycle_version" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prepared_by" UUID NOT NULL,
    "predecessor_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" UUID,
    "decision_reason" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "summary_version_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_lifecycle_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_lifecycle_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_lifecycle_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateTable
CREATE TABLE "season_summary_case" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "current_confirmed_version_id" UUID,
    "needs_reconfirmation" BOOLEAN NOT NULL DEFAULT false,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_summary_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_summary_version" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prepared_by" UUID NOT NULL,
    "predecessor_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" UUID,
    "decision_reason" TEXT,
    "basis_statistics_revision" BIGINT,
    "source_snapshot" JSONB,
    "report_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_summary_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_summary_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "season_summary_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regulation_case_season_id_key" ON "regulation_case"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_case_id_current_draft_version_id_key" ON "regulation_case"("id", "current_draft_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_case_season_id_id_key" ON "regulation_case"("season_id", "id");

-- CreateIndex
CREATE INDEX "regulation_version_season_id_state_proposed_effective_at_idx" ON "regulation_version"("season_id", "state", "proposed_effective_at");

-- CreateIndex
CREATE INDEX "regulation_version_prepared_by_idx" ON "regulation_version"("prepared_by");

-- CreateIndex
CREATE INDEX "regulation_version_decided_by_idx" ON "regulation_version"("decided_by");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_version_case_id_version_number_key" ON "regulation_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_version_case_id_id_key" ON "regulation_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_version_season_id_id_key" ON "regulation_version"("season_id", "id");

-- CreateIndex
CREATE INDEX "regulation_version_editor_account_id_idx" ON "regulation_version_editor"("account_id");

-- CreateIndex
CREATE INDEX "registration_window_regulation_version_id_intake_kind_idx" ON "registration_window"("regulation_version_id", "intake_kind");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_priority_regulation_version_id_criterion_code_key" ON "ranking_priority"("regulation_version_id", "criterion_code");

-- CreateIndex
CREATE UNIQUE INDEX "goal_type_regulation_version_id_code_key" ON "goal_type"("regulation_version_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "card_type_regulation_version_id_code_key" ON "card_type"("regulation_version_id", "code");

-- CreateIndex
CREATE INDEX "regulation_change_request_season_id_state_idx" ON "regulation_change_request"("season_id", "state");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_change_request_id_current_version_id_key" ON "regulation_change_request"("id", "current_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_change_request_season_id_id_key" ON "regulation_change_request"("season_id", "id");

-- CreateIndex
CREATE INDEX "regulation_change_version_prepared_by_idx" ON "regulation_change_version"("prepared_by");

-- CreateIndex
CREATE INDEX "regulation_change_version_decided_by_idx" ON "regulation_change_version"("decided_by");

-- CreateIndex
CREATE INDEX "regulation_change_version_waiting_version_id_idx" ON "regulation_change_version"("waiting_version_id");

-- CreateIndex
CREATE INDEX "regulation_change_version_replacement_version_id_idx" ON "regulation_change_version"("replacement_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_change_version_case_id_version_number_key" ON "regulation_change_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_change_version_case_id_id_key" ON "regulation_change_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "regulation_change_version_season_id_case_id_id_key" ON "regulation_change_version"("season_id", "case_id", "id");

-- CreateIndex
CREATE INDEX "regulation_change_version_editor_account_id_idx" ON "regulation_change_version_editor"("account_id");

-- CreateIndex
CREATE INDEX "season_lifecycle_request_season_id_idx" ON "season_lifecycle_request"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_lifecycle_request_id_current_version_id_key" ON "season_lifecycle_request"("id", "current_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_lifecycle_request_season_id_id_key" ON "season_lifecycle_request"("season_id", "id");

-- CreateIndex
CREATE INDEX "season_lifecycle_version_prepared_by_idx" ON "season_lifecycle_version"("prepared_by");

-- CreateIndex
CREATE INDEX "season_lifecycle_version_decided_by_idx" ON "season_lifecycle_version"("decided_by");

-- CreateIndex
CREATE INDEX "season_lifecycle_version_summary_version_id_idx" ON "season_lifecycle_version"("summary_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_lifecycle_version_case_id_version_number_key" ON "season_lifecycle_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "season_lifecycle_version_case_id_id_key" ON "season_lifecycle_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "season_lifecycle_version_season_id_case_id_id_key" ON "season_lifecycle_version"("season_id", "case_id", "id");

-- CreateIndex
CREATE INDEX "season_lifecycle_version_editor_account_id_idx" ON "season_lifecycle_version_editor"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_summary_case_season_id_key" ON "season_summary_case"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_summary_case_id_current_confirmed_version_id_key" ON "season_summary_case"("id", "current_confirmed_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_summary_case_season_id_id_key" ON "season_summary_case"("season_id", "id");

-- CreateIndex
CREATE INDEX "season_summary_version_prepared_by_idx" ON "season_summary_version"("prepared_by");

-- CreateIndex
CREATE INDEX "season_summary_version_decided_by_idx" ON "season_summary_version"("decided_by");

-- CreateIndex
CREATE UNIQUE INDEX "season_summary_version_case_id_version_number_key" ON "season_summary_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "season_summary_version_case_id_id_key" ON "season_summary_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "season_summary_version_season_id_id_key" ON "season_summary_version"("season_id", "id");

-- CreateIndex
CREATE INDEX "season_summary_version_editor_account_id_idx" ON "season_summary_version_editor"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "season_id_current_regulation_version_id_key" ON "season"("id", "current_regulation_version_id");

-- AddForeignKey
ALTER TABLE "season" ADD CONSTRAINT "season_id_current_regulation_version_id_fkey" FOREIGN KEY ("id", "current_regulation_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_case" ADD CONSTRAINT "regulation_case_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_case" ADD CONSTRAINT "regulation_case_id_current_draft_version_id_fkey" FOREIGN KEY ("id", "current_draft_version_id") REFERENCES "regulation_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_version" ADD CONSTRAINT "regulation_version_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_version" ADD CONSTRAINT "regulation_version_season_id_case_id_fkey" FOREIGN KEY ("season_id", "case_id") REFERENCES "regulation_case"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_version" ADD CONSTRAINT "regulation_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_version" ADD CONSTRAINT "regulation_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "regulation_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_version" ADD CONSTRAINT "regulation_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_version_editor" ADD CONSTRAINT "regulation_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "regulation_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_version_editor" ADD CONSTRAINT "regulation_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_window" ADD CONSTRAINT "registration_window_regulation_version_id_fkey" FOREIGN KEY ("regulation_version_id") REFERENCES "regulation_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ranking_priority" ADD CONSTRAINT "ranking_priority_regulation_version_id_fkey" FOREIGN KEY ("regulation_version_id") REFERENCES "regulation_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goal_type" ADD CONSTRAINT "goal_type_regulation_version_id_fkey" FOREIGN KEY ("regulation_version_id") REFERENCES "regulation_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "card_type" ADD CONSTRAINT "card_type_regulation_version_id_fkey" FOREIGN KEY ("regulation_version_id") REFERENCES "regulation_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_request" ADD CONSTRAINT "regulation_change_request_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_request" ADD CONSTRAINT "regulation_change_request_id_current_version_id_fkey" FOREIGN KEY ("id", "current_version_id") REFERENCES "regulation_change_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version" ADD CONSTRAINT "regulation_change_version_season_id_case_id_fkey" FOREIGN KEY ("season_id", "case_id") REFERENCES "regulation_change_request"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version" ADD CONSTRAINT "regulation_change_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version" ADD CONSTRAINT "regulation_change_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "regulation_change_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version" ADD CONSTRAINT "regulation_change_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version" ADD CONSTRAINT "regulation_change_version_season_id_waiting_version_id_fkey" FOREIGN KEY ("season_id", "waiting_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version" ADD CONSTRAINT "regulation_change_version_season_id_replacement_version_id_fkey" FOREIGN KEY ("season_id", "replacement_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version_editor" ADD CONSTRAINT "regulation_change_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "regulation_change_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regulation_change_version_editor" ADD CONSTRAINT "regulation_change_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_request" ADD CONSTRAINT "season_lifecycle_request_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_request" ADD CONSTRAINT "season_lifecycle_request_id_current_version_id_fkey" FOREIGN KEY ("id", "current_version_id") REFERENCES "season_lifecycle_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_version" ADD CONSTRAINT "season_lifecycle_version_season_id_case_id_fkey" FOREIGN KEY ("season_id", "case_id") REFERENCES "season_lifecycle_request"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_version" ADD CONSTRAINT "season_lifecycle_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_version" ADD CONSTRAINT "season_lifecycle_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "season_lifecycle_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_version" ADD CONSTRAINT "season_lifecycle_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_version" ADD CONSTRAINT "season_lifecycle_version_season_id_summary_version_id_fkey" FOREIGN KEY ("season_id", "summary_version_id") REFERENCES "season_summary_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_version_editor" ADD CONSTRAINT "season_lifecycle_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "season_lifecycle_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_lifecycle_version_editor" ADD CONSTRAINT "season_lifecycle_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_case" ADD CONSTRAINT "season_summary_case_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_case" ADD CONSTRAINT "season_summary_case_id_current_confirmed_version_id_fkey" FOREIGN KEY ("id", "current_confirmed_version_id") REFERENCES "season_summary_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_version" ADD CONSTRAINT "season_summary_version_season_id_case_id_fkey" FOREIGN KEY ("season_id", "case_id") REFERENCES "season_summary_case"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_version" ADD CONSTRAINT "season_summary_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_version" ADD CONSTRAINT "season_summary_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "season_summary_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_version" ADD CONSTRAINT "season_summary_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_version_editor" ADD CONSTRAINT "season_summary_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "season_summary_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "season_summary_version_editor" ADD CONSTRAINT "season_summary_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE regulation_case
  ADD CONSTRAINT regulation_case_revision CHECK (revision > 0);

ALTER TABLE regulation_version
  ADD CONSTRAINT regulation_version_version_number CHECK (version_number > 0),
  ADD CONSTRAINT regulation_version_revision CHECK (revision > 0),
  ADD CONSTRAINT regulation_version_state CHECK (state IN (
    'DRAFT','SUBMITTED','RETURNED','WITHDRAWN','REJECTED','APPROVED_WAITING',
    'EFFECTIVE','SUPERSEDED','CANCELLED','ACTIVATION_BLOCKED'
  )),
  ADD CONSTRAINT regulation_version_effective_mode CHECK (
    effective_mode IS NULL OR effective_mode IN ('IMMEDIATE','SCHEDULED')
  ),
  ADD CONSTRAINT regulation_version_immediate_has_no_proposed_time CHECK (
    effective_mode IS DISTINCT FROM 'IMMEDIATE' OR proposed_effective_at IS NULL
  ),
  ADD CONSTRAINT regulation_version_submission_mode CHECK (
    state = 'DRAFT' OR (submitted_at IS NOT NULL AND effective_mode IS NOT NULL)
  ),
  ADD CONSTRAINT regulation_version_scheduled_submission_time CHECK (
    state = 'DRAFT' OR effective_mode <> 'SCHEDULED' OR proposed_effective_at IS NOT NULL
  ),
  ADD CONSTRAINT regulation_version_approved_time CHECK (
    state NOT IN ('APPROVED_WAITING','EFFECTIVE','SUPERSEDED','CANCELLED','ACTIVATION_BLOCKED')
    OR approved_at IS NOT NULL
  ),
  ADD CONSTRAINT regulation_version_waiting_is_scheduled CHECK (
    state <> 'APPROVED_WAITING' OR effective_mode = 'SCHEDULED'
  ),
  ADD CONSTRAINT regulation_version_effective_has_start CHECK (
    state <> 'EFFECTIVE' OR active_from IS NOT NULL
  ),
  ADD CONSTRAINT regulation_version_active_interval CHECK (
    active_until IS NULL OR (active_from IS NOT NULL AND active_until >= active_from)
  ),
  ADD CONSTRAINT regulation_version_squad_limit CHECK (squad_limit IS NULL OR squad_limit >= 0),
  ADD CONSTRAINT regulation_version_non_homegrown_limit CHECK (
    non_homegrown_limit IS NULL OR non_homegrown_limit >= 0
  ),
  ADD CONSTRAINT regulation_version_homegrown_seasons CHECK (
    homegrown_seasons IS NULL OR homegrown_seasons > 0
  ),
  ADD CONSTRAINT regulation_version_homegrown_months CHECK (
    homegrown_months IS NULL OR homegrown_months > 0
  ),
  ADD CONSTRAINT regulation_version_homegrown_age_start CHECK (
    homegrown_age_start IS NULL OR homegrown_age_start > 0
  ),
  ADD CONSTRAINT regulation_version_homegrown_age_end CHECK (
    homegrown_age_end IS NULL OR homegrown_age_end > 0
  ),
  ADD CONSTRAINT regulation_version_homegrown_age_order CHECK (
    homegrown_age_start IS NULL OR homegrown_age_end IS NULL OR homegrown_age_start <= homegrown_age_end
  ),
  ADD CONSTRAINT regulation_version_club_count CHECK (
    club_count IS NULL OR (club_count BETWEEN 4 AND 20 AND club_count % 2 = 0)
  ),
  ADD CONSTRAINT regulation_version_format CHECK (
    format_code IS NULL OR format_code = 'DOUBLE_ROUND_ROBIN'
  ),
  ADD CONSTRAINT regulation_version_legs CHECK (legs IS NULL OR legs = 2),
  ADD CONSTRAINT regulation_version_planned_minutes CHECK (
    planned_minutes IS NULL OR planned_minutes > 0
  ),
  ADD CONSTRAINT regulation_version_preparation_minutes CHECK (
    preparation_minutes IS NULL OR preparation_minutes >= 0
  ),
  ADD CONSTRAINT regulation_version_release_minutes CHECK (
    release_minutes IS NULL OR release_minutes >= 0
  ),
  ADD CONSTRAINT regulation_version_points_order CHECK (
    win_points IS NULL OR draw_points IS NULL OR loss_points IS NULL
    OR (win_points > draw_points AND draw_points > loss_points)
  ),
  ADD CONSTRAINT regulation_version_qualification_count CHECK (
    qualification_count IS NULL OR qualification_count >= 0
  ),
  ADD CONSTRAINT regulation_version_relegation_count CHECK (
    relegation_count IS NULL OR relegation_count >= 0
  ),
  ADD CONSTRAINT regulation_version_qualification_relegation_range CHECK (
    club_count IS NULL OR qualification_count IS NULL OR relegation_count IS NULL
    OR (relegation_count < club_count AND qualification_count + relegation_count <= club_count)
  );

CREATE UNIQUE INDEX regulation_version_one_approved_waiting
  ON regulation_version(season_id) WHERE state = 'APPROVED_WAITING';
CREATE UNIQUE INDEX regulation_version_one_effective
  ON regulation_version(season_id) WHERE state = 'EFFECTIVE';
CREATE INDEX regulation_version_waiting_due
  ON regulation_version(proposed_effective_at, season_id) WHERE state = 'APPROVED_WAITING';

ALTER TABLE registration_window
  ADD CONSTRAINT registration_window_intake_kind
    CHECK (intake_kind IN ('CLUB_APPLICATION','PLAYER_CHANGE')),
  ADD CONSTRAINT registration_window_dates CHECK (opens_at < closes_at);

ALTER TABLE ranking_priority
  ADD CONSTRAINT ranking_priority_positive_position CHECK (position > 0),
  ADD CONSTRAINT ranking_priority_criterion
    CHECK (criterion_code IN ('POINTS','GOAL_DIFFERENCE','GOALS_FOR'));

ALTER TABLE goal_type
  ADD CONSTRAINT goal_type_code CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  ADD CONSTRAINT goal_type_name CHECK (char_length(btrim(name)) BETWEEN 1 AND 200);

ALTER TABLE card_type
  ADD CONSTRAINT card_type_code CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  ADD CONSTRAINT card_type_name CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
  ADD CONSTRAINT card_type_meaning CHECK (meaning IN ('YELLOW','RED'));

ALTER TABLE regulation_change_request
  ADD CONSTRAINT regulation_change_request_state CHECK (
    state IN ('DRAFT','SUBMITTED','RETURNED','WITHDRAWN','REJECTED','APPROVED')
  ),
  ADD CONSTRAINT regulation_change_request_revision CHECK (revision > 0);

ALTER TABLE regulation_change_version
  ADD CONSTRAINT regulation_change_version_number CHECK (version_number > 0),
  ADD CONSTRAINT regulation_change_version_revision CHECK (revision > 0),
  ADD CONSTRAINT regulation_change_version_state CHECK (
    state IN ('DRAFT','SUBMITTED','RETURNED','WITHDRAWN','REJECTED','APPROVED')
  ),
  ADD CONSTRAINT regulation_change_version_action CHECK (action IN ('CANCEL','REPLACE')),
  ADD CONSTRAINT regulation_change_version_replacement CHECK (
    (action = 'CANCEL' AND replacement_version_id IS NULL)
    OR (action = 'REPLACE' AND replacement_version_id IS NOT NULL)
  ),
  ADD CONSTRAINT regulation_change_version_reason CHECK (
    reason IS NULL OR char_length(btrim(reason)) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT regulation_change_version_submission CHECK (
    state = 'DRAFT' OR (
      submitted_at IS NOT NULL AND reason IS NOT NULL
      AND char_length(btrim(reason)) BETWEEN 1 AND 2000
    )
  );

ALTER TABLE season_lifecycle_request
  ADD CONSTRAINT season_lifecycle_request_revision CHECK (revision > 0);

ALTER TABLE season_lifecycle_version
  ADD CONSTRAINT season_lifecycle_version_number CHECK (version_number > 0),
  ADD CONSTRAINT season_lifecycle_version_revision CHECK (revision > 0),
  ADD CONSTRAINT season_lifecycle_version_state CHECK (
    state IN ('DRAFT','SUBMITTED','RETURNED','WITHDRAWN','REJECTED','APPROVED')
  ),
  ADD CONSTRAINT season_lifecycle_version_action CHECK (action IN ('CLOSE','REOPEN')),
  ADD CONSTRAINT season_lifecycle_version_reason CHECK (
    reason IS NULL OR char_length(btrim(reason)) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT season_lifecycle_version_summary_action CHECK (
    (action = 'CLOSE') OR summary_version_id IS NULL
  ),
  ADD CONSTRAINT season_lifecycle_version_submission CHECK (
    state = 'DRAFT' OR (
      submitted_at IS NOT NULL
      AND reason IS NOT NULL
      AND char_length(btrim(reason)) BETWEEN 1 AND 2000
      AND (action <> 'CLOSE' OR summary_version_id IS NOT NULL)
    )
  );

ALTER TABLE season_summary_case
  ADD CONSTRAINT season_summary_case_revision CHECK (revision > 0);

ALTER TABLE season_summary_version
  ADD CONSTRAINT season_summary_version_number CHECK (version_number > 0),
  ADD CONSTRAINT season_summary_version_revision CHECK (revision > 0),
  ADD CONSTRAINT season_summary_version_state CHECK (
    state IN ('DRAFT','SUBMITTED','RETURNED','WITHDRAWN','CONFIRMED')
  ),
  ADD CONSTRAINT season_summary_version_basis_revision CHECK (
    basis_statistics_revision IS NULL OR basis_statistics_revision >= 0
  );

CREATE FUNCTION prevent_phase2_version_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'PHASE 2 version history is retained' USING ERRCODE = '23514';
END;
$$;

CREATE FUNCTION protect_phase2_submitted_content() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  immutable_new JSONB;
  immutable_old JSONB;
BEGIN
  IF OLD.submitted_at IS NOT NULL THEN
    immutable_new := to_jsonb(NEW) - ARRAY[
      'revision','state','decided_at','decided_by','decision_reason',
      'approved_at','activation_processed_at','active_from','active_until'
    ];
    immutable_old := to_jsonb(OLD) - ARRAY[
      'revision','state','decided_at','decided_by','decision_reason',
      'approved_at','activation_processed_at','active_from','active_until'
    ];
    IF immutable_new IS DISTINCT FROM immutable_old THEN
      RAISE EXCEPTION 'Submitted PHASE 2 version content is immutable' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION prevent_phase2_editor_history_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'PHASE 2 editor history is retained' USING ERRCODE = '23514';
END;
$$;

CREATE FUNCTION prevent_phase2_editor_after_submission() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  submitted_at_value TIMESTAMPTZ(6);
BEGIN
  IF TG_TABLE_NAME = 'regulation_version_editor' THEN
    SELECT submitted_at INTO submitted_at_value FROM regulation_version WHERE id = NEW.version_id FOR NO KEY UPDATE;
  ELSIF TG_TABLE_NAME = 'regulation_change_version_editor' THEN
    SELECT submitted_at INTO submitted_at_value FROM regulation_change_version WHERE id = NEW.version_id FOR NO KEY UPDATE;
  ELSIF TG_TABLE_NAME = 'season_lifecycle_version_editor' THEN
    SELECT submitted_at INTO submitted_at_value FROM season_lifecycle_version WHERE id = NEW.version_id FOR NO KEY UPDATE;
  ELSE
    SELECT submitted_at INTO submitted_at_value FROM season_summary_version WHERE id = NEW.version_id FOR NO KEY UPDATE;
  END IF;
  IF submitted_at_value IS NOT NULL THEN
    RAISE EXCEPTION 'Editors are fixed when PHASE 2 content is submitted' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION protect_regulation_child_content() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_version_id UUID;
  submitted_at_value TIMESTAMPTZ(6);
BEGIN
  IF TG_OP = 'DELETE' THEN
    parent_version_id := OLD.regulation_version_id;
  ELSE
    parent_version_id := NEW.regulation_version_id;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.regulation_version_id <> NEW.regulation_version_id THEN
    RAISE EXCEPTION 'Regulation content cannot move between versions' USING ERRCODE = '23514';
  END IF;
  SELECT submitted_at INTO submitted_at_value FROM regulation_version WHERE id = parent_version_id FOR NO KEY UPDATE;
  IF submitted_at_value IS NOT NULL THEN
    RAISE EXCEPTION 'Submitted regulation content is immutable' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION reject_overlapping_registration_windows() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM id FROM regulation_version WHERE id = NEW.regulation_version_id FOR NO KEY UPDATE;
  IF EXISTS (
    SELECT 1 FROM registration_window existing
    WHERE existing.regulation_version_id = NEW.regulation_version_id
      AND existing.intake_kind = NEW.intake_kind
      AND existing.id <> NEW.id
      AND tstzrange(existing.opens_at, existing.closes_at, '[)')
          && tstzrange(NEW.opens_at, NEW.closes_at, '[)')
  ) THEN
    RAISE EXCEPTION 'Registration windows overlap within the same intake group' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION validate_regulation_ranking_on_submit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  priority_count INTEGER;
  positions INTEGER[];
BEGIN
  IF NEW.state = 'SUBMITTED' THEN
    SELECT count(*)::INTEGER, array_agg(position ORDER BY position)
      INTO priority_count, positions
    FROM ranking_priority WHERE regulation_version_id = NEW.id;
    IF priority_count <> 3 OR positions <> ARRAY[1,2,3] THEN
      RAISE EXCEPTION 'Submitted regulation requires contiguous POINTS, GOAL_DIFFERENCE and GOALS_FOR priority' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION seed_regulation_preparer_editor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO regulation_version_editor(version_id, account_id, first_edited_at)
  VALUES (NEW.id, NEW.prepared_by, NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE FUNCTION seed_regulation_change_preparer_editor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO regulation_change_version_editor(version_id, account_id, first_edited_at)
  VALUES (NEW.id, NEW.prepared_by, NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE FUNCTION seed_lifecycle_preparer_editor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO season_lifecycle_version_editor(version_id, account_id, first_edited_at)
  VALUES (NEW.id, NEW.prepared_by, NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE FUNCTION seed_summary_preparer_editor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO season_summary_version_editor(version_id, account_id, first_edited_at)
  VALUES (NEW.id, NEW.prepared_by, NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER regulation_version_seed_preparer AFTER INSERT ON regulation_version
  FOR EACH ROW EXECUTE FUNCTION seed_regulation_preparer_editor();
CREATE TRIGGER regulation_change_version_seed_preparer AFTER INSERT ON regulation_change_version
  FOR EACH ROW EXECUTE FUNCTION seed_regulation_change_preparer_editor();
CREATE TRIGGER season_lifecycle_version_seed_preparer AFTER INSERT ON season_lifecycle_version
  FOR EACH ROW EXECUTE FUNCTION seed_lifecycle_preparer_editor();
CREATE TRIGGER season_summary_version_seed_preparer AFTER INSERT ON season_summary_version
  FOR EACH ROW EXECUTE FUNCTION seed_summary_preparer_editor();

CREATE TRIGGER regulation_version_immutable BEFORE UPDATE ON regulation_version
  FOR EACH ROW EXECUTE FUNCTION protect_phase2_submitted_content();
CREATE TRIGGER regulation_change_version_immutable BEFORE UPDATE ON regulation_change_version
  FOR EACH ROW EXECUTE FUNCTION protect_phase2_submitted_content();
CREATE TRIGGER season_lifecycle_version_immutable BEFORE UPDATE ON season_lifecycle_version
  FOR EACH ROW EXECUTE FUNCTION protect_phase2_submitted_content();
CREATE TRIGGER season_summary_version_immutable BEFORE UPDATE ON season_summary_version
  FOR EACH ROW EXECUTE FUNCTION protect_phase2_submitted_content();

CREATE TRIGGER regulation_version_no_delete BEFORE DELETE ON regulation_version
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_version_delete();
CREATE TRIGGER regulation_change_version_no_delete BEFORE DELETE ON regulation_change_version
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_version_delete();
CREATE TRIGGER season_lifecycle_version_no_delete BEFORE DELETE ON season_lifecycle_version
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_version_delete();
CREATE TRIGGER season_summary_version_no_delete BEFORE DELETE ON season_summary_version
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_version_delete();

CREATE TRIGGER regulation_version_editor_preserve BEFORE UPDATE OR DELETE ON regulation_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_history_change();
CREATE TRIGGER regulation_change_version_editor_preserve BEFORE UPDATE OR DELETE ON regulation_change_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_history_change();
CREATE TRIGGER season_lifecycle_version_editor_preserve BEFORE UPDATE OR DELETE ON season_lifecycle_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_history_change();
CREATE TRIGGER season_summary_version_editor_preserve BEFORE UPDATE OR DELETE ON season_summary_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_history_change();

CREATE TRIGGER regulation_version_editor_before_submit BEFORE INSERT ON regulation_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_after_submission();
CREATE TRIGGER regulation_change_version_editor_before_submit BEFORE INSERT ON regulation_change_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_after_submission();
CREATE TRIGGER season_lifecycle_version_editor_before_submit BEFORE INSERT ON season_lifecycle_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_after_submission();
CREATE TRIGGER season_summary_version_editor_before_submit BEFORE INSERT ON season_summary_version_editor
  FOR EACH ROW EXECUTE FUNCTION prevent_phase2_editor_after_submission();

CREATE TRIGGER regulation_window_overlap BEFORE INSERT OR UPDATE ON registration_window
  FOR EACH ROW EXECUTE FUNCTION reject_overlapping_registration_windows();
CREATE TRIGGER regulation_window_immutable BEFORE INSERT OR UPDATE OR DELETE ON registration_window
  FOR EACH ROW EXECUTE FUNCTION protect_regulation_child_content();
CREATE TRIGGER ranking_priority_immutable BEFORE INSERT OR UPDATE OR DELETE ON ranking_priority
  FOR EACH ROW EXECUTE FUNCTION protect_regulation_child_content();
CREATE TRIGGER goal_type_immutable BEFORE INSERT OR UPDATE OR DELETE ON goal_type
  FOR EACH ROW EXECUTE FUNCTION protect_regulation_child_content();
CREATE TRIGGER card_type_immutable BEFORE INSERT OR UPDATE OR DELETE ON card_type
  FOR EACH ROW EXECUTE FUNCTION protect_regulation_child_content();
CREATE TRIGGER regulation_ranking_complete_before_submit BEFORE INSERT OR UPDATE OF state ON regulation_version
  FOR EACH ROW EXECUTE FUNCTION validate_regulation_ranking_on_submit();

ALTER TABLE season DROP CONSTRAINT season_competition_name;
ALTER TABLE season ADD CONSTRAINT season_competition_name
  CHECK (char_length(btrim(competition_name)) BETWEEN 1 AND 200);

DO $$
DECLARE
  existing_season_count BIGINT;
  staged_mapping_count BIGINT;
  staged_mapping_relation TEXT := format('%I.%I', current_schema(), 'phase2_season_competition_name_backfill');
BEGIN
  SELECT count(*) INTO existing_season_count FROM season;
  IF to_regclass(staged_mapping_relation) IS NOT NULL THEN
    EXECUTE format('SELECT count(*) FROM %s', staged_mapping_relation)
      INTO staged_mapping_count;
    IF staged_mapping_count <> existing_season_count THEN
      RAISE EXCEPTION 'Every existing Season requires one reviewed competitionName mapping before PHASE 2 migration'
        USING ERRCODE = '23514';
    END IF;
    EXECUTE format('UPDATE season AS target
                    SET competition_name = mapping.competition_name
                    FROM %s AS mapping
                    WHERE mapping.season_id = target.id', staged_mapping_relation);
    EXECUTE format('DROP TABLE %s', staged_mapping_relation);
  ELSIF existing_season_count > 0 THEN
    RAISE EXCEPTION 'Stage the reviewed per-Season competitionName mapping before PHASE 2 migration'
      USING ERRCODE = '23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM season
    WHERE competition_name IS NULL OR char_length(btrim(competition_name)) NOT BETWEEN 1 AND 200
  ) THEN
    RAISE EXCEPTION 'PHASE 2 migration found a missing or invalid competitionName mapping'
      USING ERRCODE = '23514';
  END IF;
END;
$$;

ALTER TABLE season ALTER COLUMN competition_name SET NOT NULL;

COMMIT;

