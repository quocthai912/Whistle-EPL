BEGIN;

-- AlterTable
ALTER TABLE "media_asset" ADD COLUMN     "player_id" UUID,
ALTER COLUMN "club_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "position" (
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "vietnamese_label" TEXT NOT NULL,
    "catalog_version" TEXT NOT NULL,

    CONSTRAINT "position_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "nationality" (
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "vietnamese_label" TEXT NOT NULL,
    "catalog_version" TEXT NOT NULL,

    CONSTRAINT "nationality_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "player" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "nationality_code" TEXT NOT NULL,
    "position_code" TEXT NOT NULL,
    "current_portrait_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_application" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "current_draft_version_id" UUID,
    "current_accepted_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_application_version" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "version_kind" TEXT NOT NULL DEFAULT 'INITIAL',
    "prepared_by" UUID NOT NULL,
    "predecessor_version_id" UUID,
    "base_accepted_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "received_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" UUID,
    "decision_reason" TEXT,
    "coach_name" TEXT,
    "home_stadium_id" UUID,
    "representative_name" TEXT,
    "representative_phone" TEXT,
    "contact_address" TEXT,
    "notes" TEXT,
    "correction_reason" TEXT,
    "correction_evidence" TEXT,
    "affected_references" JSONB,
    "receipt_regulation_version_id" UUID,
    "receipt_timing_status" TEXT,
    "receipt_window_id" UUID,
    "approval_regulation_version_id" UUID,
    "official_snapshot" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_application_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_application_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_application_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateTable
CREATE TABLE "proposed_player_item" (
    "id" UUID NOT NULL,
    "application_version_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "position_order" INTEGER NOT NULL,
    "shirt_number" INTEGER,
    "notes" TEXT,

    CONSTRAINT "proposed_player_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_registration" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "current_draft_version_id" UUID,
    "current_validated_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_version" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prepared_by" UUID NOT NULL,
    "predecessor_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "received_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),
    "decided_by" UUID,
    "decision_reason" TEXT,
    "shirt_number" INTEGER,
    "playing_start" TIMESTAMPTZ(6),
    "playing_end" TIMESTAMPTZ(6),
    "u21_finding" BOOLEAN,
    "homegrown_finding" BOOLEAN,
    "non_homegrown_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "evidence_branch" TEXT,
    "qualifying_value" INTEGER,
    "evidence_summary" TEXT,
    "evidence_reference" TEXT,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "receipt_regulation_version_id" UUID,
    "receipt_timing_status" TEXT,
    "receipt_window_id" UUID,
    "decision_regulation_version_id" UUID,
    "official_snapshot" JSONB,
    "playing_disposition" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_operation" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "old_case_id" UUID NOT NULL,
    "new_case_id" UUID NOT NULL,
    "old_before_version_id" UUID NOT NULL,
    "old_after_version_id" UUID NOT NULL,
    "new_version_id" UUID NOT NULL,
    "effective_at" TIMESTAMPTZ(6) NOT NULL,
    "operation_kind" TEXT NOT NULL DEFAULT 'TRANSFER',
    "reason" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "supersedes_operation_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_exception_case" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "current_version_id" UUID,
    "approved_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_exception_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_exception_version" (
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
    "club_application_version_id" UUID,
    "registration_version_id" UUID,
    "reason" TEXT,
    "basis" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_exception_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_exception_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_exception_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateTable
CREATE TABLE "registration_correction_case" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "current_version_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_correction_case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_correction_version" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
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
    "target_version_id" UUID NOT NULL,
    "proposed_version_id" UUID NOT NULL,
    "reason" TEXT,
    "basis" TEXT,
    "disposition" TEXT,
    "before_summary" JSONB,
    "after_summary" JSONB,
    "affected_references" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_correction_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_correction_version_editor" (
    "version_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "first_edited_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_correction_version_editor_pkey" PRIMARY KEY ("version_id","account_id")
);

-- CreateTable
CREATE TABLE "registration_correction_segment" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "correction_version_id" UUID NOT NULL,
    "segment_order" INTEGER NOT NULL,
    "segment_start" TIMESTAMPTZ(6) NOT NULL,
    "segment_end" TIMESTAMPTZ(6),
    "regulation_version_id" UUID NOT NULL,
    "outcome" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "required_disposition" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_correction_segment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_code_key" ON "player"("code");

-- CreateIndex
CREATE INDEX "player_duplicate_review_idx" ON "player"("full_name", "birth_date", "nationality_code");

-- CreateIndex
CREATE INDEX "player_nationality_code_idx" ON "player"("nationality_code");

-- CreateIndex
CREATE INDEX "player_position_code_idx" ON "player"("position_code");

-- CreateIndex
CREATE UNIQUE INDEX "player_id_current_portrait_id_key" ON "player"("id", "current_portrait_id");

-- CreateIndex
CREATE INDEX "club_application_club_id_idx" ON "club_application"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_season_id_club_id_key" ON "club_application"("season_id", "club_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_season_id_id_key" ON "club_application"("season_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_id_current_draft_version_id_key" ON "club_application"("id", "current_draft_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_id_current_accepted_version_id_key" ON "club_application"("id", "current_accepted_version_id");

-- CreateIndex
CREATE INDEX "club_application_version_season_id_state_idx" ON "club_application_version"("season_id", "state");

-- CreateIndex
CREATE INDEX "club_application_version_prepared_by_idx" ON "club_application_version"("prepared_by");

-- CreateIndex
CREATE INDEX "club_application_version_decided_by_idx" ON "club_application_version"("decided_by");

-- CreateIndex
CREATE INDEX "club_application_version_home_stadium_id_idx" ON "club_application_version"("home_stadium_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_version_case_id_version_number_key" ON "club_application_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_version_case_id_id_key" ON "club_application_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_version_season_id_id_key" ON "club_application_version"("season_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "club_application_version_season_id_case_id_id_key" ON "club_application_version"("season_id", "case_id", "id");

-- CreateIndex
CREATE INDEX "club_application_version_editor_account_id_idx" ON "club_application_version_editor"("account_id");

-- CreateIndex
CREATE INDEX "proposed_player_item_player_id_idx" ON "proposed_player_item"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposed_player_item_application_version_id_player_id_key" ON "proposed_player_item"("application_version_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposed_player_item_application_version_id_position_order_key" ON "proposed_player_item"("application_version_id", "position_order");

-- CreateIndex
CREATE INDEX "player_registration_season_id_club_id_idx" ON "player_registration"("season_id", "club_id");

-- CreateIndex
CREATE INDEX "player_registration_player_id_season_id_idx" ON "player_registration"("player_id", "season_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_registration_season_id_id_key" ON "player_registration"("season_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "player_registration_id_current_draft_version_id_key" ON "player_registration"("id", "current_draft_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_registration_id_current_validated_version_id_key" ON "player_registration"("id", "current_validated_version_id");

-- CreateIndex
CREATE INDEX "registration_version_season_id_state_playing_start_playing__idx" ON "registration_version"("season_id", "state", "playing_start", "playing_end");

-- CreateIndex
CREATE INDEX "registration_version_prepared_by_idx" ON "registration_version"("prepared_by");

-- CreateIndex
CREATE INDEX "registration_version_decided_by_idx" ON "registration_version"("decided_by");

-- CreateIndex
CREATE INDEX "registration_version_verified_by_idx" ON "registration_version"("verified_by");

-- CreateIndex
CREATE UNIQUE INDEX "registration_version_case_id_version_number_key" ON "registration_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "registration_version_case_id_id_key" ON "registration_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_version_season_id_id_key" ON "registration_version"("season_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_version_season_id_case_id_id_key" ON "registration_version"("season_id", "case_id", "id");

-- CreateIndex
CREATE INDEX "transfer_operation_player_id_created_at_idx" ON "transfer_operation"("player_id", "created_at");

-- CreateIndex
CREATE INDEX "transfer_operation_old_case_id_idx" ON "transfer_operation"("old_case_id");

-- CreateIndex
CREATE INDEX "transfer_operation_new_case_id_idx" ON "transfer_operation"("new_case_id");

-- CreateIndex
CREATE INDEX "transfer_operation_actor_id_idx" ON "transfer_operation"("actor_id");

-- CreateIndex
CREATE INDEX "receipt_exception_case_season_id_idx" ON "receipt_exception_case"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_exception_case_season_id_id_key" ON "receipt_exception_case"("season_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_exception_case_id_current_version_id_key" ON "receipt_exception_case"("id", "current_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_exception_case_id_approved_version_id_key" ON "receipt_exception_case"("id", "approved_version_id");

-- CreateIndex
CREATE INDEX "receipt_exception_version_club_application_version_id_idx" ON "receipt_exception_version"("club_application_version_id");

-- CreateIndex
CREATE INDEX "receipt_exception_version_registration_version_id_idx" ON "receipt_exception_version"("registration_version_id");

-- CreateIndex
CREATE INDEX "receipt_exception_version_prepared_by_idx" ON "receipt_exception_version"("prepared_by");

-- CreateIndex
CREATE INDEX "receipt_exception_version_decided_by_idx" ON "receipt_exception_version"("decided_by");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_exception_version_case_id_version_number_key" ON "receipt_exception_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_exception_version_case_id_id_key" ON "receipt_exception_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_exception_version_season_id_case_id_id_key" ON "receipt_exception_version"("season_id", "case_id", "id");

-- CreateIndex
CREATE INDEX "receipt_exception_version_editor_account_id_idx" ON "receipt_exception_version_editor"("account_id");

-- CreateIndex
CREATE INDEX "registration_correction_case_season_id_registration_id_idx" ON "registration_correction_case"("season_id", "registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_correction_case_season_id_id_key" ON "registration_correction_case"("season_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_correction_case_registration_id_id_key" ON "registration_correction_case"("registration_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_correction_case_id_current_version_id_key" ON "registration_correction_case"("id", "current_version_id");

-- CreateIndex
CREATE INDEX "registration_correction_version_prepared_by_idx" ON "registration_correction_version"("prepared_by");

-- CreateIndex
CREATE INDEX "registration_correction_version_decided_by_idx" ON "registration_correction_version"("decided_by");

-- CreateIndex
CREATE INDEX "registration_correction_version_target_version_id_idx" ON "registration_correction_version"("target_version_id");

-- CreateIndex
CREATE INDEX "registration_correction_version_proposed_version_id_idx" ON "registration_correction_version"("proposed_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_correction_version_case_id_version_number_key" ON "registration_correction_version"("case_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "registration_correction_version_case_id_id_key" ON "registration_correction_version"("case_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_correction_version_season_id_id_key" ON "registration_correction_version"("season_id", "id");

-- CreateIndex
CREATE INDEX "registration_correction_version_editor_account_id_idx" ON "registration_correction_version_editor"("account_id");

-- CreateIndex
CREATE INDEX "registration_correction_segment_regulation_version_id_idx" ON "registration_correction_segment"("regulation_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_correction_segment_correction_version_id_segme_key" ON "registration_correction_segment"("correction_version_id", "segment_order");

-- CreateIndex
CREATE INDEX "media_asset_player_id_created_at_idx" ON "media_asset"("player_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_player_id_id_key" ON "media_asset"("player_id", "id");

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_nationality_code_fkey" FOREIGN KEY ("nationality_code") REFERENCES "nationality"("code") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_position_code_fkey" FOREIGN KEY ("position_code") REFERENCES "position"("code") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_id_current_portrait_id_fkey" FOREIGN KEY ("id", "current_portrait_id") REFERENCES "media_asset"("player_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application" ADD CONSTRAINT "club_application_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application" ADD CONSTRAINT "club_application_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application" ADD CONSTRAINT "club_application_id_current_draft_version_id_fkey" FOREIGN KEY ("id", "current_draft_version_id") REFERENCES "club_application_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application" ADD CONSTRAINT "club_application_id_current_accepted_version_id_fkey" FOREIGN KEY ("id", "current_accepted_version_id") REFERENCES "club_application_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_season_id_case_id_fkey" FOREIGN KEY ("season_id", "case_id") REFERENCES "club_application"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "club_application_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_case_id_base_accepted_version_id_fkey" FOREIGN KEY ("case_id", "base_accepted_version_id") REFERENCES "club_application_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_home_stadium_id_fkey" FOREIGN KEY ("home_stadium_id") REFERENCES "stadium"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_season_id_receipt_regulation_vers_fkey" FOREIGN KEY ("season_id", "receipt_regulation_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_receipt_window_id_fkey" FOREIGN KEY ("receipt_window_id") REFERENCES "registration_window"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version" ADD CONSTRAINT "club_application_version_season_id_approval_regulation_ver_fkey" FOREIGN KEY ("season_id", "approval_regulation_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version_editor" ADD CONSTRAINT "club_application_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "club_application_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "club_application_version_editor" ADD CONSTRAINT "club_application_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proposed_player_item" ADD CONSTRAINT "proposed_player_item_application_version_id_fkey" FOREIGN KEY ("application_version_id") REFERENCES "club_application_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proposed_player_item" ADD CONSTRAINT "proposed_player_item_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "player_registration_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "player_registration_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "player_registration_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "player_registration_id_current_draft_version_id_fkey" FOREIGN KEY ("id", "current_draft_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "player_registration" ADD CONSTRAINT "player_registration_id_current_validated_version_id_fkey" FOREIGN KEY ("id", "current_validated_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_season_id_case_id_fkey" FOREIGN KEY ("season_id", "case_id") REFERENCES "player_registration"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_season_id_receipt_regulation_version__fkey" FOREIGN KEY ("season_id", "receipt_regulation_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_receipt_window_id_fkey" FOREIGN KEY ("receipt_window_id") REFERENCES "registration_window"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_version" ADD CONSTRAINT "registration_version_season_id_decision_regulation_version_fkey" FOREIGN KEY ("season_id", "decision_regulation_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_old_case_id_fkey" FOREIGN KEY ("old_case_id") REFERENCES "player_registration"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_new_case_id_fkey" FOREIGN KEY ("new_case_id") REFERENCES "player_registration"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_old_case_id_old_before_version_id_fkey" FOREIGN KEY ("old_case_id", "old_before_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_old_case_id_old_after_version_id_fkey" FOREIGN KEY ("old_case_id", "old_after_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_new_case_id_new_version_id_fkey" FOREIGN KEY ("new_case_id", "new_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transfer_operation" ADD CONSTRAINT "transfer_operation_supersedes_operation_id_fkey" FOREIGN KEY ("supersedes_operation_id") REFERENCES "transfer_operation"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_case" ADD CONSTRAINT "receipt_exception_case_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_case" ADD CONSTRAINT "receipt_exception_case_id_current_version_id_fkey" FOREIGN KEY ("id", "current_version_id") REFERENCES "receipt_exception_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_case" ADD CONSTRAINT "receipt_exception_case_id_approved_version_id_fkey" FOREIGN KEY ("id", "approved_version_id") REFERENCES "receipt_exception_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version" ADD CONSTRAINT "receipt_exception_version_season_id_case_id_fkey" FOREIGN KEY ("season_id", "case_id") REFERENCES "receipt_exception_case"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version" ADD CONSTRAINT "receipt_exception_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version" ADD CONSTRAINT "receipt_exception_version_case_id_predecessor_version_id_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "receipt_exception_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version" ADD CONSTRAINT "receipt_exception_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version" ADD CONSTRAINT "receipt_exception_version_season_id_club_application_versi_fkey" FOREIGN KEY ("season_id", "club_application_version_id") REFERENCES "club_application_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version" ADD CONSTRAINT "receipt_exception_version_season_id_registration_version_i_fkey" FOREIGN KEY ("season_id", "registration_version_id") REFERENCES "registration_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version_editor" ADD CONSTRAINT "receipt_exception_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "receipt_exception_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipt_exception_version_editor" ADD CONSTRAINT "receipt_exception_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_case" ADD CONSTRAINT "registration_correction_case_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_case" ADD CONSTRAINT "registration_correction_case_season_id_registration_id_fkey" FOREIGN KEY ("season_id", "registration_id") REFERENCES "player_registration"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_case" ADD CONSTRAINT "registration_correction_case_id_current_version_id_fkey" FOREIGN KEY ("id", "current_version_id") REFERENCES "registration_correction_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version" ADD CONSTRAINT "registration_correction_version_registration_id_case_id_fkey" FOREIGN KEY ("registration_id", "case_id") REFERENCES "registration_correction_case"("registration_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version" ADD CONSTRAINT "registration_correction_version_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version" ADD CONSTRAINT "registration_correction_version_case_id_predecessor_versio_fkey" FOREIGN KEY ("case_id", "predecessor_version_id") REFERENCES "registration_correction_version"("case_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version" ADD CONSTRAINT "registration_correction_version_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version" ADD CONSTRAINT "registration_correction_version_registration_id_target_ver_fkey" FOREIGN KEY ("registration_id", "target_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version" ADD CONSTRAINT "registration_correction_version_registration_id_proposed_v_fkey" FOREIGN KEY ("registration_id", "proposed_version_id") REFERENCES "registration_version"("case_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version_editor" ADD CONSTRAINT "registration_correction_version_editor_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "registration_correction_version"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_version_editor" ADD CONSTRAINT "registration_correction_version_editor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_segment" ADD CONSTRAINT "registration_correction_segment_season_id_correction_versi_fkey" FOREIGN KEY ("season_id", "correction_version_id") REFERENCES "registration_correction_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "registration_correction_segment" ADD CONSTRAINT "registration_correction_segment_season_id_regulation_versi_fkey" FOREIGN KEY ("season_id", "regulation_version_id") REFERENCES "regulation_version"("season_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Q98-approved reference catalogs (WHISTLE-POSITION-1: 13 keys, WHISTLE-NATIONALITY-1: 253 keys)
INSERT INTO "position" ("code", "display_name", "vietnamese_label", "catalog_version") VALUES
  ('GK', 'Goalkeeper', 'Thủ môn', 'WHISTLE-POSITION-1'),
  ('LB', 'Left back', 'Hậu vệ trái', 'WHISTLE-POSITION-1'),
  ('CB', 'Centre back', 'Trung vệ', 'WHISTLE-POSITION-1'),
  ('RB', 'Right back', 'Hậu vệ phải', 'WHISTLE-POSITION-1'),
  ('CDM', 'Central defensive midfielder', 'Tiền vệ phòng ngự trung tâm', 'WHISTLE-POSITION-1'),
  ('CM', 'Central midfielder', 'Tiền vệ trung tâm', 'WHISTLE-POSITION-1'),
  ('CAM', 'Central attacking midfielder', 'Tiền vệ tấn công trung tâm', 'WHISTLE-POSITION-1'),
  ('LW', 'Left winger', 'Tiền đạo cánh trái', 'WHISTLE-POSITION-1'),
  ('LM', 'Left midfielder', 'Tiền vệ trái', 'WHISTLE-POSITION-1'),
  ('RW', 'Right winger', 'Tiền đạo cánh phải', 'WHISTLE-POSITION-1'),
  ('RM', 'Right midfielder', 'Tiền vệ phải', 'WHISTLE-POSITION-1'),
  ('ST', 'Striker', 'Tiền đạo cắm', 'WHISTLE-POSITION-1'),
  ('CF', 'Centre forward', 'Tiền đạo trung tâm', 'WHISTLE-POSITION-1');

INSERT INTO "nationality" ("code", "display_name", "vietnamese_label", "catalog_version") VALUES
  ('AD', 'Andorra', 'Andorra', 'WHISTLE-NATIONALITY-1'),
  ('AE', 'United Arab Emirates', 'Các Tiểu Vương quốc Ả Rập Thống nhất', 'WHISTLE-NATIONALITY-1'),
  ('AF', 'Afghanistan', 'Afghanistan', 'WHISTLE-NATIONALITY-1'),
  ('AG', 'Antigua & Barbuda', 'Antigua và Barbuda', 'WHISTLE-NATIONALITY-1'),
  ('AI', 'Anguilla', 'Anguilla', 'WHISTLE-NATIONALITY-1'),
  ('AL', 'Albania', 'Albania', 'WHISTLE-NATIONALITY-1'),
  ('AM', 'Armenia', 'Armenia', 'WHISTLE-NATIONALITY-1'),
  ('AO', 'Angola', 'Angola', 'WHISTLE-NATIONALITY-1'),
  ('AQ', 'Antarctica', 'Nam Cực', 'WHISTLE-NATIONALITY-1'),
  ('AR', 'Argentina', 'Argentina', 'WHISTLE-NATIONALITY-1'),
  ('AS', 'American Samoa', 'Samoa thuộc Mỹ', 'WHISTLE-NATIONALITY-1'),
  ('AT', 'Austria', 'Áo', 'WHISTLE-NATIONALITY-1'),
  ('AU', 'Australia', 'Úc', 'WHISTLE-NATIONALITY-1'),
  ('AW', 'Aruba', 'Aruba', 'WHISTLE-NATIONALITY-1'),
  ('AX', 'Åland Islands', 'Quần đảo Åland', 'WHISTLE-NATIONALITY-1'),
  ('AZ', 'Azerbaijan', 'Azerbaijan', 'WHISTLE-NATIONALITY-1'),
  ('BA', 'Bosnia & Herzegovina', 'Bosnia và Herzegovina', 'WHISTLE-NATIONALITY-1'),
  ('BB', 'Barbados', 'Barbados', 'WHISTLE-NATIONALITY-1'),
  ('BD', 'Bangladesh', 'Bangladesh', 'WHISTLE-NATIONALITY-1'),
  ('BE', 'Belgium', 'Bỉ', 'WHISTLE-NATIONALITY-1'),
  ('BF', 'Burkina Faso', 'Burkina Faso', 'WHISTLE-NATIONALITY-1'),
  ('BG', 'Bulgaria', 'Bulgaria', 'WHISTLE-NATIONALITY-1'),
  ('BH', 'Bahrain', 'Bahrain', 'WHISTLE-NATIONALITY-1'),
  ('BI', 'Burundi', 'Burundi', 'WHISTLE-NATIONALITY-1'),
  ('BJ', 'Benin', 'Benin', 'WHISTLE-NATIONALITY-1'),
  ('BL', 'St. Barthélemy', 'St. Barthélemy', 'WHISTLE-NATIONALITY-1'),
  ('BM', 'Bermuda', 'Bermuda', 'WHISTLE-NATIONALITY-1'),
  ('BN', 'Brunei', 'Brunei', 'WHISTLE-NATIONALITY-1'),
  ('BO', 'Bolivia', 'Bolivia', 'WHISTLE-NATIONALITY-1'),
  ('BQ', 'Caribbean Netherlands', 'Ca-ri-bê Hà Lan', 'WHISTLE-NATIONALITY-1'),
  ('BR', 'Brazil', 'Brazil', 'WHISTLE-NATIONALITY-1'),
  ('BS', 'Bahamas', 'Bahamas', 'WHISTLE-NATIONALITY-1'),
  ('BT', 'Bhutan', 'Bhutan', 'WHISTLE-NATIONALITY-1'),
  ('BV', 'Bouvet Island', 'Đảo Bouvet', 'WHISTLE-NATIONALITY-1'),
  ('BW', 'Botswana', 'Botswana', 'WHISTLE-NATIONALITY-1'),
  ('BY', 'Belarus', 'Belarus', 'WHISTLE-NATIONALITY-1'),
  ('BZ', 'Belize', 'Belize', 'WHISTLE-NATIONALITY-1'),
  ('CA', 'Canada', 'Canada', 'WHISTLE-NATIONALITY-1'),
  ('CC', 'Cocos (Keeling) Islands', 'Quần đảo Cocos (Keeling)', 'WHISTLE-NATIONALITY-1'),
  ('CD', 'Congo - Kinshasa', 'Congo - Kinshasa', 'WHISTLE-NATIONALITY-1'),
  ('CF', 'Central African Republic', 'Cộng hòa Trung Phi', 'WHISTLE-NATIONALITY-1'),
  ('CG', 'Congo - Brazzaville', 'Congo - Brazzaville', 'WHISTLE-NATIONALITY-1'),
  ('CH', 'Switzerland', 'Thụy Sĩ', 'WHISTLE-NATIONALITY-1'),
  ('CI', 'Côte d’Ivoire', 'Côte d’Ivoire', 'WHISTLE-NATIONALITY-1'),
  ('CK', 'Cook Islands', 'Quần đảo Cook', 'WHISTLE-NATIONALITY-1'),
  ('CL', 'Chile', 'Chile', 'WHISTLE-NATIONALITY-1'),
  ('CM', 'Cameroon', 'Cameroon', 'WHISTLE-NATIONALITY-1'),
  ('CN', 'China', 'Trung Quốc', 'WHISTLE-NATIONALITY-1'),
  ('CO', 'Colombia', 'Colombia', 'WHISTLE-NATIONALITY-1'),
  ('CR', 'Costa Rica', 'Costa Rica', 'WHISTLE-NATIONALITY-1'),
  ('CU', 'Cuba', 'Cuba', 'WHISTLE-NATIONALITY-1'),
  ('CV', 'Cape Verde', 'Cape Verde', 'WHISTLE-NATIONALITY-1'),
  ('CW', 'Curaçao', 'Curaçao', 'WHISTLE-NATIONALITY-1'),
  ('CX', 'Christmas Island', 'Đảo Giáng Sinh', 'WHISTLE-NATIONALITY-1'),
  ('CY', 'Cyprus', 'Síp', 'WHISTLE-NATIONALITY-1'),
  ('CZ', 'Czechia', 'Séc', 'WHISTLE-NATIONALITY-1'),
  ('DE', 'Germany', 'Đức', 'WHISTLE-NATIONALITY-1'),
  ('DJ', 'Djibouti', 'Djibouti', 'WHISTLE-NATIONALITY-1'),
  ('DK', 'Denmark', 'Đan Mạch', 'WHISTLE-NATIONALITY-1'),
  ('DM', 'Dominica', 'Dominica', 'WHISTLE-NATIONALITY-1'),
  ('DO', 'Dominican Republic', 'Cộng hòa Dominica', 'WHISTLE-NATIONALITY-1'),
  ('DZ', 'Algeria', 'Algeria', 'WHISTLE-NATIONALITY-1'),
  ('EC', 'Ecuador', 'Ecuador', 'WHISTLE-NATIONALITY-1'),
  ('EE', 'Estonia', 'Estonia', 'WHISTLE-NATIONALITY-1'),
  ('EG', 'Egypt', 'Ai Cập', 'WHISTLE-NATIONALITY-1'),
  ('EH', 'Western Sahara', 'Tây Sahara', 'WHISTLE-NATIONALITY-1'),
  ('ENG', 'England', 'Anh', 'WHISTLE-NATIONALITY-1'),
  ('ER', 'Eritrea', 'Eritrea', 'WHISTLE-NATIONALITY-1'),
  ('ES', 'Spain', 'Tây Ban Nha', 'WHISTLE-NATIONALITY-1'),
  ('ET', 'Ethiopia', 'Ethiopia', 'WHISTLE-NATIONALITY-1'),
  ('FI', 'Finland', 'Phần Lan', 'WHISTLE-NATIONALITY-1'),
  ('FJ', 'Fiji', 'Fiji', 'WHISTLE-NATIONALITY-1'),
  ('FK', 'Falkland Islands', 'Quần đảo Falkland', 'WHISTLE-NATIONALITY-1'),
  ('FM', 'Micronesia', 'Micronesia', 'WHISTLE-NATIONALITY-1'),
  ('FO', 'Faroe Islands', 'Quần đảo Faroe', 'WHISTLE-NATIONALITY-1'),
  ('FR', 'France', 'Pháp', 'WHISTLE-NATIONALITY-1'),
  ('GA', 'Gabon', 'Gabon', 'WHISTLE-NATIONALITY-1'),
  ('GB', 'United Kingdom', 'Vương quốc Anh', 'WHISTLE-NATIONALITY-1'),
  ('GD', 'Grenada', 'Grenada', 'WHISTLE-NATIONALITY-1'),
  ('GE', 'Georgia', 'Georgia', 'WHISTLE-NATIONALITY-1'),
  ('GF', 'French Guiana', 'Guiana thuộc Pháp', 'WHISTLE-NATIONALITY-1'),
  ('GG', 'Guernsey', 'Guernsey', 'WHISTLE-NATIONALITY-1'),
  ('GH', 'Ghana', 'Ghana', 'WHISTLE-NATIONALITY-1'),
  ('GI', 'Gibraltar', 'Gibraltar', 'WHISTLE-NATIONALITY-1'),
  ('GL', 'Greenland', 'Greenland', 'WHISTLE-NATIONALITY-1'),
  ('GM', 'Gambia', 'Gambia', 'WHISTLE-NATIONALITY-1'),
  ('GN', 'Guinea', 'Guinea', 'WHISTLE-NATIONALITY-1'),
  ('GP', 'Guadeloupe', 'Guadeloupe', 'WHISTLE-NATIONALITY-1'),
  ('GQ', 'Equatorial Guinea', 'Guinea Xích Đạo', 'WHISTLE-NATIONALITY-1'),
  ('GR', 'Greece', 'Hy Lạp', 'WHISTLE-NATIONALITY-1'),
  ('GS', 'South Georgia & South Sandwich Islands', 'Nam Georgia & Quần đảo Nam Sandwich', 'WHISTLE-NATIONALITY-1'),
  ('GT', 'Guatemala', 'Guatemala', 'WHISTLE-NATIONALITY-1'),
  ('GU', 'Guam', 'Guam', 'WHISTLE-NATIONALITY-1'),
  ('GW', 'Guinea-Bissau', 'Guinea-Bissau', 'WHISTLE-NATIONALITY-1'),
  ('GY', 'Guyana', 'Guyana', 'WHISTLE-NATIONALITY-1'),
  ('HK', 'Hong Kong SAR China', 'Đặc khu Hành chính Hồng Kông, Trung Quốc', 'WHISTLE-NATIONALITY-1'),
  ('HM', 'Heard & McDonald Islands', 'Quần đảo Heard và McDonald', 'WHISTLE-NATIONALITY-1'),
  ('HN', 'Honduras', 'Honduras', 'WHISTLE-NATIONALITY-1'),
  ('HR', 'Croatia', 'Croatia', 'WHISTLE-NATIONALITY-1'),
  ('HT', 'Haiti', 'Haiti', 'WHISTLE-NATIONALITY-1'),
  ('HU', 'Hungary', 'Hungary', 'WHISTLE-NATIONALITY-1'),
  ('ID', 'Indonesia', 'Indonesia', 'WHISTLE-NATIONALITY-1'),
  ('IE', 'Ireland', 'Ireland', 'WHISTLE-NATIONALITY-1'),
  ('IL', 'Israel', 'Israel', 'WHISTLE-NATIONALITY-1'),
  ('IM', 'Isle of Man', 'Đảo Man', 'WHISTLE-NATIONALITY-1'),
  ('IN', 'India', 'Ấn Độ', 'WHISTLE-NATIONALITY-1'),
  ('IO', 'British Indian Ocean Territory', 'Lãnh thổ Ấn Độ Dương thuộc Anh', 'WHISTLE-NATIONALITY-1'),
  ('IQ', 'Iraq', 'Iraq', 'WHISTLE-NATIONALITY-1'),
  ('IR', 'Iran', 'Iran', 'WHISTLE-NATIONALITY-1'),
  ('IS', 'Iceland', 'Iceland', 'WHISTLE-NATIONALITY-1'),
  ('IT', 'Italy', 'Italy', 'WHISTLE-NATIONALITY-1'),
  ('JE', 'Jersey', 'Jersey', 'WHISTLE-NATIONALITY-1'),
  ('JM', 'Jamaica', 'Jamaica', 'WHISTLE-NATIONALITY-1'),
  ('JO', 'Jordan', 'Jordan', 'WHISTLE-NATIONALITY-1'),
  ('JP', 'Japan', 'Nhật Bản', 'WHISTLE-NATIONALITY-1'),
  ('KE', 'Kenya', 'Kenya', 'WHISTLE-NATIONALITY-1'),
  ('KG', 'Kyrgyzstan', 'Kyrgyzstan', 'WHISTLE-NATIONALITY-1'),
  ('KH', 'Cambodia', 'Campuchia', 'WHISTLE-NATIONALITY-1'),
  ('KI', 'Kiribati', 'Kiribati', 'WHISTLE-NATIONALITY-1'),
  ('KM', 'Comoros', 'Comoros', 'WHISTLE-NATIONALITY-1'),
  ('KN', 'St. Kitts & Nevis', 'St. Kitts và Nevis', 'WHISTLE-NATIONALITY-1'),
  ('KP', 'North Korea', 'Triều Tiên', 'WHISTLE-NATIONALITY-1'),
  ('KR', 'South Korea', 'Hàn Quốc', 'WHISTLE-NATIONALITY-1'),
  ('KW', 'Kuwait', 'Kuwait', 'WHISTLE-NATIONALITY-1'),
  ('KY', 'Cayman Islands', 'Quần đảo Cayman', 'WHISTLE-NATIONALITY-1'),
  ('KZ', 'Kazakhstan', 'Kazakhstan', 'WHISTLE-NATIONALITY-1'),
  ('LA', 'Laos', 'Lào', 'WHISTLE-NATIONALITY-1'),
  ('LB', 'Lebanon', 'Li-băng', 'WHISTLE-NATIONALITY-1'),
  ('LC', 'St. Lucia', 'St. Lucia', 'WHISTLE-NATIONALITY-1'),
  ('LI', 'Liechtenstein', 'Liechtenstein', 'WHISTLE-NATIONALITY-1'),
  ('LK', 'Sri Lanka', 'Sri Lanka', 'WHISTLE-NATIONALITY-1'),
  ('LR', 'Liberia', 'Liberia', 'WHISTLE-NATIONALITY-1'),
  ('LS', 'Lesotho', 'Lesotho', 'WHISTLE-NATIONALITY-1'),
  ('LT', 'Lithuania', 'Litva', 'WHISTLE-NATIONALITY-1'),
  ('LU', 'Luxembourg', 'Luxembourg', 'WHISTLE-NATIONALITY-1'),
  ('LV', 'Latvia', 'Latvia', 'WHISTLE-NATIONALITY-1'),
  ('LY', 'Libya', 'Libya', 'WHISTLE-NATIONALITY-1'),
  ('MA', 'Morocco', 'Ma-rốc', 'WHISTLE-NATIONALITY-1'),
  ('MC', 'Monaco', 'Monaco', 'WHISTLE-NATIONALITY-1'),
  ('MD', 'Moldova', 'Moldova', 'WHISTLE-NATIONALITY-1'),
  ('ME', 'Montenegro', 'Montenegro', 'WHISTLE-NATIONALITY-1'),
  ('MF', 'St. Martin', 'St. Martin', 'WHISTLE-NATIONALITY-1'),
  ('MG', 'Madagascar', 'Madagascar', 'WHISTLE-NATIONALITY-1'),
  ('MH', 'Marshall Islands', 'Quần đảo Marshall', 'WHISTLE-NATIONALITY-1'),
  ('MK', 'North Macedonia', 'Bắc Macedonia', 'WHISTLE-NATIONALITY-1'),
  ('ML', 'Mali', 'Mali', 'WHISTLE-NATIONALITY-1'),
  ('MM', 'Myanmar (Burma)', 'Myanmar (Miến Điện)', 'WHISTLE-NATIONALITY-1'),
  ('MN', 'Mongolia', 'Mông Cổ', 'WHISTLE-NATIONALITY-1'),
  ('MO', 'Macao SAR China', 'Đặc khu Hành chính Macao, Trung Quốc', 'WHISTLE-NATIONALITY-1'),
  ('MP', 'Northern Mariana Islands', 'Quần đảo Bắc Mariana', 'WHISTLE-NATIONALITY-1'),
  ('MQ', 'Martinique', 'Martinique', 'WHISTLE-NATIONALITY-1'),
  ('MR', 'Mauritania', 'Mauritania', 'WHISTLE-NATIONALITY-1'),
  ('MS', 'Montserrat', 'Montserrat', 'WHISTLE-NATIONALITY-1'),
  ('MT', 'Malta', 'Malta', 'WHISTLE-NATIONALITY-1'),
  ('MU', 'Mauritius', 'Mauritius', 'WHISTLE-NATIONALITY-1'),
  ('MV', 'Maldives', 'Maldives', 'WHISTLE-NATIONALITY-1'),
  ('MW', 'Malawi', 'Malawi', 'WHISTLE-NATIONALITY-1'),
  ('MX', 'Mexico', 'Mexico', 'WHISTLE-NATIONALITY-1'),
  ('MY', 'Malaysia', 'Malaysia', 'WHISTLE-NATIONALITY-1'),
  ('MZ', 'Mozambique', 'Mozambique', 'WHISTLE-NATIONALITY-1'),
  ('NA', 'Namibia', 'Namibia', 'WHISTLE-NATIONALITY-1'),
  ('NC', 'New Caledonia', 'New Caledonia', 'WHISTLE-NATIONALITY-1'),
  ('NE', 'Niger', 'Niger', 'WHISTLE-NATIONALITY-1'),
  ('NF', 'Norfolk Island', 'Đảo Norfolk', 'WHISTLE-NATIONALITY-1'),
  ('NG', 'Nigeria', 'Nigeria', 'WHISTLE-NATIONALITY-1'),
  ('NI', 'Nicaragua', 'Nicaragua', 'WHISTLE-NATIONALITY-1'),
  ('NIR', 'Northern Ireland', 'Bắc Ireland', 'WHISTLE-NATIONALITY-1'),
  ('NL', 'Netherlands', 'Hà Lan', 'WHISTLE-NATIONALITY-1'),
  ('NO', 'Norway', 'Na Uy', 'WHISTLE-NATIONALITY-1'),
  ('NP', 'Nepal', 'Nepal', 'WHISTLE-NATIONALITY-1'),
  ('NR', 'Nauru', 'Nauru', 'WHISTLE-NATIONALITY-1'),
  ('NU', 'Niue', 'Niue', 'WHISTLE-NATIONALITY-1'),
  ('NZ', 'New Zealand', 'New Zealand', 'WHISTLE-NATIONALITY-1'),
  ('OM', 'Oman', 'Oman', 'WHISTLE-NATIONALITY-1'),
  ('PA', 'Panama', 'Panama', 'WHISTLE-NATIONALITY-1'),
  ('PE', 'Peru', 'Peru', 'WHISTLE-NATIONALITY-1'),
  ('PF', 'French Polynesia', 'Polynesia thuộc Pháp', 'WHISTLE-NATIONALITY-1'),
  ('PG', 'Papua New Guinea', 'Papua New Guinea', 'WHISTLE-NATIONALITY-1'),
  ('PH', 'Philippines', 'Philippines', 'WHISTLE-NATIONALITY-1'),
  ('PK', 'Pakistan', 'Pakistan', 'WHISTLE-NATIONALITY-1'),
  ('PL', 'Poland', 'Ba Lan', 'WHISTLE-NATIONALITY-1'),
  ('PM', 'St. Pierre & Miquelon', 'Saint Pierre và Miquelon', 'WHISTLE-NATIONALITY-1'),
  ('PN', 'Pitcairn Islands', 'Quần đảo Pitcairn', 'WHISTLE-NATIONALITY-1'),
  ('PR', 'Puerto Rico', 'Puerto Rico', 'WHISTLE-NATIONALITY-1'),
  ('PS', 'Palestinian Territories', 'Lãnh thổ Palestine', 'WHISTLE-NATIONALITY-1'),
  ('PT', 'Portugal', 'Bồ Đào Nha', 'WHISTLE-NATIONALITY-1'),
  ('PW', 'Palau', 'Palau', 'WHISTLE-NATIONALITY-1'),
  ('PY', 'Paraguay', 'Paraguay', 'WHISTLE-NATIONALITY-1'),
  ('QA', 'Qatar', 'Qatar', 'WHISTLE-NATIONALITY-1'),
  ('RE', 'Réunion', 'Réunion', 'WHISTLE-NATIONALITY-1'),
  ('RO', 'Romania', 'Romania', 'WHISTLE-NATIONALITY-1'),
  ('RS', 'Serbia', 'Serbia', 'WHISTLE-NATIONALITY-1'),
  ('RU', 'Russia', 'Nga', 'WHISTLE-NATIONALITY-1'),
  ('RW', 'Rwanda', 'Rwanda', 'WHISTLE-NATIONALITY-1'),
  ('SA', 'Saudi Arabia', 'Ả Rập Xê-út', 'WHISTLE-NATIONALITY-1'),
  ('SB', 'Solomon Islands', 'Quần đảo Solomon', 'WHISTLE-NATIONALITY-1'),
  ('SC', 'Seychelles', 'Seychelles', 'WHISTLE-NATIONALITY-1'),
  ('SCO', 'Scotland', 'Scotland', 'WHISTLE-NATIONALITY-1'),
  ('SD', 'Sudan', 'Sudan', 'WHISTLE-NATIONALITY-1'),
  ('SE', 'Sweden', 'Thụy Điển', 'WHISTLE-NATIONALITY-1'),
  ('SG', 'Singapore', 'Singapore', 'WHISTLE-NATIONALITY-1'),
  ('SH', 'St. Helena', 'St. Helena', 'WHISTLE-NATIONALITY-1'),
  ('SI', 'Slovenia', 'Slovenia', 'WHISTLE-NATIONALITY-1'),
  ('SJ', 'Svalbard & Jan Mayen', 'Svalbard và Jan Mayen', 'WHISTLE-NATIONALITY-1'),
  ('SK', 'Slovakia', 'Slovakia', 'WHISTLE-NATIONALITY-1'),
  ('SL', 'Sierra Leone', 'Sierra Leone', 'WHISTLE-NATIONALITY-1'),
  ('SM', 'San Marino', 'San Marino', 'WHISTLE-NATIONALITY-1'),
  ('SN', 'Senegal', 'Senegal', 'WHISTLE-NATIONALITY-1'),
  ('SO', 'Somalia', 'Somalia', 'WHISTLE-NATIONALITY-1'),
  ('SR', 'Suriname', 'Suriname', 'WHISTLE-NATIONALITY-1'),
  ('SS', 'South Sudan', 'Nam Sudan', 'WHISTLE-NATIONALITY-1'),
  ('ST', 'São Tomé & Príncipe', 'São Tomé và Príncipe', 'WHISTLE-NATIONALITY-1'),
  ('SV', 'El Salvador', 'El Salvador', 'WHISTLE-NATIONALITY-1'),
  ('SX', 'Sint Maarten', 'Sint Maarten', 'WHISTLE-NATIONALITY-1'),
  ('SY', 'Syria', 'Syria', 'WHISTLE-NATIONALITY-1'),
  ('SZ', 'Eswatini', 'Eswatini', 'WHISTLE-NATIONALITY-1'),
  ('TC', 'Turks & Caicos Islands', 'Quần đảo Turks và Caicos', 'WHISTLE-NATIONALITY-1'),
  ('TD', 'Chad', 'Chad', 'WHISTLE-NATIONALITY-1'),
  ('TF', 'French Southern Territories', 'Lãnh thổ phía Nam Thuộc Pháp', 'WHISTLE-NATIONALITY-1'),
  ('TG', 'Togo', 'Togo', 'WHISTLE-NATIONALITY-1'),
  ('TH', 'Thailand', 'Thái Lan', 'WHISTLE-NATIONALITY-1'),
  ('TJ', 'Tajikistan', 'Tajikistan', 'WHISTLE-NATIONALITY-1'),
  ('TK', 'Tokelau', 'Tokelau', 'WHISTLE-NATIONALITY-1'),
  ('TL', 'Timor-Leste', 'Timor-Leste', 'WHISTLE-NATIONALITY-1'),
  ('TM', 'Turkmenistan', 'Turkmenistan', 'WHISTLE-NATIONALITY-1'),
  ('TN', 'Tunisia', 'Tunisia', 'WHISTLE-NATIONALITY-1'),
  ('TO', 'Tonga', 'Tonga', 'WHISTLE-NATIONALITY-1'),
  ('TR', 'Türkiye', 'Thổ Nhĩ Kỳ', 'WHISTLE-NATIONALITY-1'),
  ('TT', 'Trinidad & Tobago', 'Trinidad và Tobago', 'WHISTLE-NATIONALITY-1'),
  ('TV', 'Tuvalu', 'Tuvalu', 'WHISTLE-NATIONALITY-1'),
  ('TW', 'Taiwan', 'Đài Loan', 'WHISTLE-NATIONALITY-1'),
  ('TZ', 'Tanzania', 'Tanzania', 'WHISTLE-NATIONALITY-1'),
  ('UA', 'Ukraine', 'Ukraina', 'WHISTLE-NATIONALITY-1'),
  ('UG', 'Uganda', 'Uganda', 'WHISTLE-NATIONALITY-1'),
  ('UM', 'U.S. Outlying Islands', 'Các tiểu đảo xa của Hoa Kỳ', 'WHISTLE-NATIONALITY-1'),
  ('US', 'United States', 'Hoa Kỳ', 'WHISTLE-NATIONALITY-1'),
  ('UY', 'Uruguay', 'Uruguay', 'WHISTLE-NATIONALITY-1'),
  ('UZ', 'Uzbekistan', 'Uzbekistan', 'WHISTLE-NATIONALITY-1'),
  ('VA', 'Vatican City', 'Thành Vatican', 'WHISTLE-NATIONALITY-1'),
  ('VC', 'St. Vincent & Grenadines', 'St. Vincent và Grenadines', 'WHISTLE-NATIONALITY-1'),
  ('VE', 'Venezuela', 'Venezuela', 'WHISTLE-NATIONALITY-1'),
  ('VG', 'British Virgin Islands', 'Quần đảo Virgin thuộc Anh', 'WHISTLE-NATIONALITY-1'),
  ('VI', 'U.S. Virgin Islands', 'Quần đảo Virgin thuộc Hoa Kỳ', 'WHISTLE-NATIONALITY-1'),
  ('VN', 'Vietnam', 'Việt Nam', 'WHISTLE-NATIONALITY-1'),
  ('VU', 'Vanuatu', 'Vanuatu', 'WHISTLE-NATIONALITY-1'),
  ('WAL', 'Wales', 'Wales', 'WHISTLE-NATIONALITY-1'),
  ('WF', 'Wallis & Futuna', 'Wallis và Futuna', 'WHISTLE-NATIONALITY-1'),
  ('WS', 'Samoa', 'Samoa', 'WHISTLE-NATIONALITY-1'),
  ('YE', 'Yemen', 'Yemen', 'WHISTLE-NATIONALITY-1'),
  ('YT', 'Mayotte', 'Mayotte', 'WHISTLE-NATIONALITY-1'),
  ('ZA', 'South Africa', 'Nam Phi', 'WHISTLE-NATIONALITY-1'),
  ('ZM', 'Zambia', 'Zambia', 'WHISTLE-NATIONALITY-1'),
  ('ZW', 'Zimbabwe', 'Zimbabwe', 'WHISTLE-NATIONALITY-1');

-- MediaAsset Club XOR Player ownership and lifecycle triggers
ALTER TABLE media_asset
  ADD CONSTRAINT media_asset_single_owner CHECK ((club_id IS NOT NULL) <> (player_id IS NOT NULL));

CREATE OR REPLACE FUNCTION preserve_media_asset_metadata() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'MediaAsset metadata is retained' USING ERRCODE = '23514';
  END IF;
  IF (NEW.id, NEW.club_id, NEW.player_id, NEW.provider, NEW.object_key, NEW.mime_type, NEW.byte_size,
      NEW.width, NEW.height, NEW.checksum, NEW.stored_by, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.club_id, OLD.player_id, OLD.provider, OLD.object_key, OLD.mime_type, OLD.byte_size,
      OLD.width, OLD.height, OLD.checksum, OLD.stored_by, OLD.created_at) THEN
    RAISE EXCEPTION 'MediaAsset storage metadata is immutable' USING ERRCODE = '23514';
  END IF;
  IF (OLD.unreferenced_at IS NOT NULL AND NEW.unreferenced_at IS DISTINCT FROM OLD.unreferenced_at)
     OR (OLD.content_deleted_at IS NOT NULL AND NEW.content_deleted_at IS DISTINCT FROM OLD.content_deleted_at) THEN
    RAISE EXCEPTION 'MediaAsset lifecycle markers are immutable once recorded' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION guard_current_logo_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.unreferenced_at IS NULL AND NEW.unreferenced_at IS NOT NULL THEN
    IF NEW.club_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM club WHERE id = NEW.club_id AND current_logo_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'A current club logo cannot be marked unreferenced' USING ERRCODE = '23514';
    END IF;
    IF NEW.player_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM player WHERE id = NEW.player_id AND current_portrait_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'A current player portrait cannot be marked unreferenced' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION guard_current_player_portrait() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  marker TIMESTAMPTZ;
BEGIN
  IF NEW.current_portrait_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.current_portrait_id IS NOT DISTINCT FROM OLD.current_portrait_id THEN
    RETURN NEW;
  END IF;
  UPDATE media_asset SET unreferenced_at = unreferenced_at
    WHERE id = NEW.current_portrait_id AND player_id = NEW.id
    RETURNING unreferenced_at INTO marker;
  IF marker IS NOT NULL THEN
    RAISE EXCEPTION 'An unreferenced asset cannot become the current player portrait' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

-- Reference catalogs immutability
CREATE FUNCTION preserve_reference_catalog() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Approved reference catalogs are immutable' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER position_immutable BEFORE UPDATE OR DELETE ON position
  FOR EACH ROW EXECUTE FUNCTION preserve_reference_catalog();
CREATE TRIGGER nationality_immutable BEFORE UPDATE OR DELETE ON nationality
  FOR EACH ROW EXECUTE FUNCTION preserve_reference_catalog();

-- Player constraints and triggers
ALTER TABLE player
  ADD CONSTRAINT player_code CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  ADD CONSTRAINT player_full_name CHECK (
    char_length(full_name) BETWEEN 1 AND 200
    AND full_name = normalize(btrim(regexp_replace(full_name, '\s+', ' ', 'g')), NFC)
  ),
  ADD CONSTRAINT player_revision CHECK (revision > 0);

CREATE TRIGGER player_identity BEFORE UPDATE OR DELETE ON player
  FOR EACH ROW EXECUTE FUNCTION preserve_shared_master_identity();
CREATE TRIGGER player_current_portrait_lifecycle BEFORE INSERT OR UPDATE OF current_portrait_id ON player
  FOR EACH ROW EXECUTE FUNCTION guard_current_player_portrait();

-- ClubApplication & ClubApplicationVersion constraints and triggers
ALTER TABLE club_application
  ADD CONSTRAINT club_application_revision CHECK (revision > 0);

ALTER TABLE club_application_version
  ADD CONSTRAINT club_application_version_number CHECK (version_number > 0),
  ADD CONSTRAINT club_application_version_revision CHECK (revision > 0),
  ADD CONSTRAINT club_application_version_kind CHECK (version_kind IN ('INITIAL', 'CORRECTION')),
  ADD CONSTRAINT club_application_version_state CHECK (
    state IN ('DRAFT', 'RECEIVED', 'PENDING_APPROVAL', 'NEEDS_SUPPLEMENTATION', 'WITHDRAWN', 'CANCELLED', 'APPROVED', 'REJECTED')
  ),
  ADD CONSTRAINT club_application_version_d100_baseline CHECK (
    (version_kind = 'INITIAL' AND base_accepted_version_id IS NULL)
    OR (version_kind = 'CORRECTION' AND base_accepted_version_id IS NOT NULL)
  ),
  ADD CONSTRAINT club_application_version_receipt_timing CHECK (
    receipt_timing_status IS NULL OR receipt_timing_status IN ('ON_TIME', 'LATE')
  ),
  ADD CONSTRAINT club_application_version_coach_name CHECK (
    coach_name IS NULL OR (char_length(coach_name) BETWEEN 1 AND 200 AND coach_name = normalize(btrim(regexp_replace(coach_name, '\s+', ' ', 'g')), NFC))
  ),
  ADD CONSTRAINT club_application_version_rep_name CHECK (
    representative_name IS NULL OR (char_length(representative_name) BETWEEN 1 AND 200 AND representative_name = normalize(btrim(regexp_replace(representative_name, '\s+', ' ', 'g')), NFC))
  ),
  ADD CONSTRAINT club_application_version_rep_phone CHECK (
    representative_phone IS NULL OR char_length(representative_phone) BETWEEN 1 AND 32
  ),
  ADD CONSTRAINT club_application_version_contact_address CHECK (
    contact_address IS NULL OR char_length(contact_address) BETWEEN 1 AND 500
  ),
  ADD CONSTRAINT club_application_version_notes CHECK (
    notes IS NULL OR char_length(notes) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT club_application_version_decision_reason CHECK (
    decision_reason IS NULL OR char_length(decision_reason) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT club_application_version_correction_reason CHECK (
    correction_reason IS NULL OR char_length(correction_reason) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT club_application_version_correction_evidence CHECK (
    correction_evidence IS NULL OR char_length(correction_evidence) BETWEEN 1 AND 2000
  );

CREATE UNIQUE INDEX club_application_version_one_draft_idx
  ON club_application_version (case_id) WHERE state = 'DRAFT';
CREATE UNIQUE INDEX club_application_version_one_pending_idx
  ON club_application_version (case_id) WHERE state = 'PENDING_APPROVAL';

CREATE FUNCTION seed_club_application_version_editor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO club_application_version_editor(version_id, account_id, first_edited_at)
  VALUES (NEW.id, NEW.prepared_by, NEW.created_at)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_application_version_seed_editor
  AFTER INSERT ON club_application_version
  FOR EACH ROW EXECUTE FUNCTION seed_club_application_version_editor();

CREATE FUNCTION preserve_club_application_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'ClubApplicationVersion history is retained' USING ERRCODE = '23514';
  END IF;
  IF (NEW.id, NEW.season_id, NEW.case_id, NEW.version_number, NEW.version_kind, NEW.prepared_by,
      NEW.predecessor_version_id, NEW.base_accepted_version_id, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.season_id, OLD.case_id, OLD.version_number, OLD.version_kind, OLD.prepared_by,
      OLD.predecessor_version_id, OLD.base_accepted_version_id, OLD.created_at) THEN
    RAISE EXCEPTION 'ClubApplicationVersion identity and lineage are immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state <> 'DRAFT' THEN
    IF (NEW.coach_name, NEW.home_stadium_id, NEW.representative_name, NEW.representative_phone,
        NEW.contact_address, NEW.notes, NEW.correction_reason, NEW.correction_evidence,
        NEW.affected_references)
       IS DISTINCT FROM
       (OLD.coach_name, OLD.home_stadium_id, OLD.representative_name, OLD.representative_phone,
        OLD.contact_address, OLD.notes, OLD.correction_reason, OLD.correction_evidence,
        OLD.affected_references) THEN
      RAISE EXCEPTION 'Submitted or received ClubApplicationVersion content is immutable' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF OLD.received_at IS NOT NULL AND (
    NEW.received_at IS DISTINCT FROM OLD.received_at OR
    NEW.receipt_regulation_version_id IS DISTINCT FROM OLD.receipt_regulation_version_id OR
    NEW.receipt_timing_status IS DISTINCT FROM OLD.receipt_timing_status OR
    NEW.receipt_window_id IS DISTINCT FROM OLD.receipt_window_id
  ) THEN
    RAISE EXCEPTION 'Recorded receipt basis is immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state IN ('APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN', 'NEEDS_SUPPLEMENTATION') AND NEW.state IS DISTINCT FROM OLD.state THEN
    RAISE EXCEPTION 'Terminal ClubApplicationVersion state is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_application_version_immutable
  BEFORE UPDATE OR DELETE ON club_application_version
  FOR EACH ROW EXECUTE FUNCTION preserve_club_application_version();

CREATE FUNCTION preserve_version_editor_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Version editor membership history is immutable' USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER club_application_version_editor_retain
  BEFORE UPDATE OR DELETE ON club_application_version_editor
  FOR EACH ROW EXECUTE FUNCTION preserve_version_editor_history();

CREATE FUNCTION guard_club_application_accepted() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_state TEXT;
BEGIN
  IF NEW.current_accepted_version_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT state INTO target_state
  FROM club_application_version
  WHERE id = NEW.current_accepted_version_id AND case_id = NEW.id;
  IF target_state IS DISTINCT FROM 'APPROVED' THEN
    RAISE EXCEPTION 'current_accepted_version_id must reference an APPROVED version' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_application_accepted_guard
  BEFORE INSERT OR UPDATE OF current_accepted_version_id ON club_application
  FOR EACH ROW EXECUTE FUNCTION guard_club_application_accepted();

-- ProposedPlayerItem constraints and draft-only trigger
ALTER TABLE proposed_player_item
  ADD CONSTRAINT proposed_player_item_order CHECK (position_order > 0),
  ADD CONSTRAINT proposed_player_item_shirt CHECK (shirt_number IS NULL OR shirt_number BETWEEN 1 AND 99),
  ADD CONSTRAINT proposed_player_item_notes CHECK (notes IS NULL OR char_length(notes) BETWEEN 1 AND 2000);

CREATE FUNCTION guard_proposed_player_item_draft_only() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_id UUID;
  parent_state TEXT;
BEGIN
  parent_id := COALESCE(NEW.application_version_id, OLD.application_version_id);
  SELECT state INTO parent_state FROM club_application_version WHERE id = parent_id;
  IF parent_state IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION 'ProposedPlayerItem cannot be modified after draft state' USING ERRCODE = '23514';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER proposed_player_item_draft_only
  BEFORE INSERT OR UPDATE OR DELETE ON proposed_player_item
  FOR EACH ROW EXECUTE FUNCTION guard_proposed_player_item_draft_only();

-- PlayerRegistration & RegistrationVersion constraints and triggers
ALTER TABLE player_registration
  ADD CONSTRAINT player_registration_revision CHECK (revision > 0);

ALTER TABLE registration_version
  ADD CONSTRAINT registration_version_number CHECK (version_number > 0),
  ADD CONSTRAINT registration_version_revision CHECK (revision > 0),
  ADD CONSTRAINT registration_version_state CHECK (
    state IN ('DRAFT', 'RECEIVED', 'NEEDS_SUPPLEMENTATION', 'CANCELLED', 'VALID')
  ),
  ADD CONSTRAINT registration_version_shirt CHECK (shirt_number IS NULL OR shirt_number BETWEEN 1 AND 99),
  ADD CONSTRAINT registration_version_interval CHECK (
    playing_start IS NULL OR playing_end IS NULL OR playing_start < playing_end
  ),
  ADD CONSTRAINT registration_version_evidence_branch CHECK (
    evidence_branch IS NULL OR evidence_branch IN ('SEASONS', 'MONTHS')
  ),
  ADD CONSTRAINT registration_version_qualifying_value CHECK (
    qualifying_value IS NULL OR qualifying_value > 0
  ),
  ADD CONSTRAINT registration_version_receipt_timing CHECK (
    receipt_timing_status IS NULL OR receipt_timing_status IN ('ON_TIME', 'LATE')
  ),
  ADD CONSTRAINT registration_version_disposition CHECK (
    playing_disposition IS NULL OR playing_disposition IN (
      'ACTIVE', 'CANCELLED_BEFORE_EFFECTIVITY', 'ENDED_BY_CORRECTION', 'RECORDED_ERRONEOUS'
    )
  ),
  ADD CONSTRAINT registration_version_evidence_summary CHECK (
    evidence_summary IS NULL OR char_length(evidence_summary) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT registration_version_evidence_reference CHECK (
    evidence_reference IS NULL OR char_length(evidence_reference) BETWEEN 1 AND 500
  ),
  ADD CONSTRAINT registration_version_decision_reason CHECK (
    decision_reason IS NULL OR char_length(decision_reason) BETWEEN 1 AND 2000
  ),
  ADD CONSTRAINT registration_version_notes CHECK (
    notes IS NULL OR char_length(notes) BETWEEN 1 AND 2000
  );

CREATE FUNCTION preserve_registration_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'RegistrationVersion history is retained' USING ERRCODE = '23514';
  END IF;
  IF (NEW.id, NEW.season_id, NEW.case_id, NEW.version_number, NEW.prepared_by,
      NEW.predecessor_version_id, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.season_id, OLD.case_id, OLD.version_number, OLD.prepared_by,
      OLD.predecessor_version_id, OLD.created_at) THEN
    RAISE EXCEPTION 'RegistrationVersion identity and lineage are immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state <> 'DRAFT' THEN
    IF (NEW.shirt_number, NEW.playing_start, NEW.playing_end, NEW.u21_finding, NEW.homegrown_finding,
        NEW.non_homegrown_opt_in, NEW.evidence_branch, NEW.qualifying_value, NEW.evidence_summary,
        NEW.evidence_reference, NEW.verified_by, NEW.verified_at, NEW.notes)
       IS DISTINCT FROM
       (OLD.shirt_number, OLD.playing_start, OLD.playing_end, OLD.u21_finding, OLD.homegrown_finding,
        OLD.non_homegrown_opt_in, OLD.evidence_branch, OLD.qualifying_value, OLD.evidence_summary,
        OLD.evidence_reference, OLD.verified_by, OLD.verified_at, OLD.notes) THEN
      RAISE EXCEPTION 'Submitted or validated RegistrationVersion content is immutable' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF OLD.received_at IS NOT NULL AND (
    NEW.received_at IS DISTINCT FROM OLD.received_at OR
    NEW.receipt_regulation_version_id IS DISTINCT FROM OLD.receipt_regulation_version_id OR
    NEW.receipt_timing_status IS DISTINCT FROM OLD.receipt_timing_status OR
    NEW.receipt_window_id IS DISTINCT FROM OLD.receipt_window_id
  ) THEN
    RAISE EXCEPTION 'Recorded registration receipt basis is immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state IN ('VALID', 'CANCELLED', 'NEEDS_SUPPLEMENTATION') AND NEW.state IS DISTINCT FROM OLD.state THEN
    RAISE EXCEPTION 'Terminal RegistrationVersion state is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER registration_version_immutable
  BEFORE UPDATE OR DELETE ON registration_version
  FOR EACH ROW EXECUTE FUNCTION preserve_registration_version();

CREATE FUNCTION guard_player_registration_validated() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_state TEXT;
BEGIN
  IF NEW.current_validated_version_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT state INTO target_state
  FROM registration_version
  WHERE id = NEW.current_validated_version_id AND case_id = NEW.id;
  IF target_state IS DISTINCT FROM 'VALID' THEN
    RAISE EXCEPTION 'current_validated_version_id must reference a VALID version' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER player_registration_validated_guard
  BEFORE INSERT OR UPDATE OF current_validated_version_id ON player_registration
  FOR EACH ROW EXECUTE FUNCTION guard_player_registration_validated();

-- TransferOperation constraints and trigger
ALTER TABLE transfer_operation
  ADD CONSTRAINT transfer_operation_distinct_cases CHECK (old_case_id <> new_case_id),
  ADD CONSTRAINT transfer_operation_distinct_old_versions CHECK (old_before_version_id <> old_after_version_id),
  ADD CONSTRAINT transfer_operation_kind CHECK (operation_kind IN ('TRANSFER', 'PLAN_CHANGE', 'PLAN_CANCEL')),
  ADD CONSTRAINT transfer_operation_reason CHECK (char_length(btrim(reason)) BETWEEN 1 AND 2000);

CREATE FUNCTION guard_transfer_operation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_player UUID;
  new_player UUID;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'TransferOperation history is append-only' USING ERRCODE = '23514';
  END IF;
  SELECT player_id INTO old_player FROM player_registration WHERE id = NEW.old_case_id;
  SELECT player_id INTO new_player FROM player_registration WHERE id = NEW.new_case_id;
  IF old_player IS DISTINCT FROM NEW.player_id OR new_player IS DISTINCT FROM NEW.player_id THEN
    RAISE EXCEPTION 'TransferOperation must bind registrations of the same player' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER transfer_operation_guard
  BEFORE INSERT OR UPDATE OR DELETE ON transfer_operation
  FOR EACH ROW EXECUTE FUNCTION guard_transfer_operation();

-- ReceiptExceptionCase & ReceiptExceptionVersion constraints and triggers
ALTER TABLE receipt_exception_case
  ADD CONSTRAINT receipt_exception_case_revision CHECK (revision > 0);

ALTER TABLE receipt_exception_version
  ADD CONSTRAINT receipt_exception_version_number CHECK (version_number > 0),
  ADD CONSTRAINT receipt_exception_version_revision CHECK (revision > 0),
  ADD CONSTRAINT receipt_exception_version_state CHECK (
    state IN ('DRAFT', 'SUBMITTED', 'RETURNED', 'WITHDRAWN', 'REJECTED', 'APPROVED')
  ),
  ADD CONSTRAINT receipt_exception_single_target CHECK (
    (club_application_version_id IS NOT NULL) <> (registration_version_id IS NOT NULL)
  ),
  ADD CONSTRAINT receipt_exception_reason CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 2000),
  ADD CONSTRAINT receipt_exception_basis CHECK (basis IS NULL OR char_length(basis) BETWEEN 1 AND 2000),
  ADD CONSTRAINT receipt_exception_decision_reason CHECK (
    decision_reason IS NULL OR char_length(decision_reason) BETWEEN 1 AND 2000
  );

CREATE UNIQUE INDEX receipt_exception_one_approved_club_app_idx
  ON receipt_exception_version (club_application_version_id)
  WHERE state = 'APPROVED' AND club_application_version_id IS NOT NULL;
CREATE UNIQUE INDEX receipt_exception_one_approved_reg_idx
  ON receipt_exception_version (registration_version_id)
  WHERE state = 'APPROVED' AND registration_version_id IS NOT NULL;

CREATE FUNCTION guard_receipt_exception_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  target_received TIMESTAMPTZ;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'ReceiptExceptionVersion history is retained' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.club_application_version_id IS NOT NULL THEN
      SELECT received_at INTO target_received FROM club_application_version
        WHERE id = NEW.club_application_version_id AND season_id = NEW.season_id;
    ELSE
      SELECT received_at INTO target_received FROM registration_version
        WHERE id = NEW.registration_version_id AND season_id = NEW.season_id;
    END IF;
    IF FOUND AND target_received IS NULL THEN
      RAISE EXCEPTION 'ReceiptExceptionVersion requires an already received target version' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  IF (NEW.id, NEW.season_id, NEW.case_id, NEW.version_number, NEW.prepared_by,
      NEW.predecessor_version_id, NEW.club_application_version_id, NEW.registration_version_id, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.season_id, OLD.case_id, OLD.version_number, OLD.prepared_by,
      OLD.predecessor_version_id, OLD.club_application_version_id, OLD.registration_version_id, OLD.created_at) THEN
    RAISE EXCEPTION 'ReceiptExceptionVersion identity and target are immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state <> 'DRAFT' AND (NEW.reason, NEW.basis) IS DISTINCT FROM (OLD.reason, OLD.basis) THEN
    RAISE EXCEPTION 'Submitted ReceiptExceptionVersion content is immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state IN ('APPROVED', 'REJECTED', 'WITHDRAWN', 'RETURNED') AND NEW.state IS DISTINCT FROM OLD.state THEN
    RAISE EXCEPTION 'Terminal ReceiptExceptionVersion state is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER receipt_exception_version_guard
  BEFORE INSERT OR UPDATE OR DELETE ON receipt_exception_version
  FOR EACH ROW EXECUTE FUNCTION guard_receipt_exception_version();

CREATE FUNCTION seed_receipt_exception_version_editor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO receipt_exception_version_editor(version_id, account_id, first_edited_at)
  VALUES (NEW.id, NEW.prepared_by, NEW.created_at)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER receipt_exception_version_seed_editor
  AFTER INSERT ON receipt_exception_version
  FOR EACH ROW EXECUTE FUNCTION seed_receipt_exception_version_editor();

CREATE TRIGGER receipt_exception_version_editor_retain
  BEFORE UPDATE OR DELETE ON receipt_exception_version_editor
  FOR EACH ROW EXECUTE FUNCTION preserve_version_editor_history();

-- RegistrationCorrectionCase, Version, Editor & Segment (D057 / FR-020)
ALTER TABLE registration_correction_case
  ADD CONSTRAINT registration_correction_case_revision CHECK (revision > 0);

ALTER TABLE registration_correction_version
  ADD CONSTRAINT registration_correction_version_number CHECK (version_number > 0),
  ADD CONSTRAINT registration_correction_version_revision CHECK (revision > 0),
  ADD CONSTRAINT registration_correction_version_state CHECK (
    state IN ('DRAFT', 'SUBMITTED', 'RETURNED', 'WITHDRAWN', 'REJECTED', 'APPROVED')
  ),
  ADD CONSTRAINT registration_correction_distinct_versions CHECK (target_version_id <> proposed_version_id),
  ADD CONSTRAINT registration_correction_disposition CHECK (
    disposition IS NULL OR disposition IN ('RETAIN_VALID', 'END_EFFECTIVITY', 'RECORD_ERRONEOUS')
  ),
  ADD CONSTRAINT registration_correction_reason CHECK (reason IS NULL OR char_length(reason) BETWEEN 1 AND 2000),
  ADD CONSTRAINT registration_correction_basis CHECK (basis IS NULL OR char_length(basis) BETWEEN 1 AND 2000),
  ADD CONSTRAINT registration_correction_decision_reason CHECK (
    decision_reason IS NULL OR char_length(decision_reason) BETWEEN 1 AND 2000
  );

ALTER TABLE registration_correction_segment
  ADD CONSTRAINT registration_correction_segment_order CHECK (segment_order > 0),
  ADD CONSTRAINT registration_correction_segment_interval CHECK (
    segment_end IS NULL OR segment_start < segment_end
  ),
  ADD CONSTRAINT registration_correction_segment_outcome CHECK (
    outcome IN ('MET', 'UNMET', 'INSUFFICIENT_BASIS')
  ),
  ADD CONSTRAINT registration_correction_segment_disposition CHECK (
    required_disposition IS NULL OR required_disposition IN ('RETAIN_VALID', 'END_EFFECTIVITY', 'RECORD_ERRONEOUS')
  );

CREATE FUNCTION seed_registration_correction_version_editor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO registration_correction_version_editor(version_id, account_id, first_edited_at)
  VALUES (NEW.id, NEW.prepared_by, NEW.created_at)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER registration_correction_version_seed_editor
  AFTER INSERT ON registration_correction_version
  FOR EACH ROW EXECUTE FUNCTION seed_registration_correction_version_editor();

CREATE TRIGGER registration_correction_version_editor_retain
  BEFORE UPDATE OR DELETE ON registration_correction_version_editor
  FOR EACH ROW EXECUTE FUNCTION preserve_version_editor_history();

CREATE FUNCTION preserve_registration_correction_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'RegistrationCorrectionVersion history is retained' USING ERRCODE = '23514';
  END IF;
  IF (NEW.id, NEW.season_id, NEW.registration_id, NEW.case_id, NEW.version_number, NEW.prepared_by,
      NEW.predecessor_version_id, NEW.target_version_id, NEW.proposed_version_id, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.season_id, OLD.registration_id, OLD.case_id, OLD.version_number, OLD.prepared_by,
      OLD.predecessor_version_id, OLD.target_version_id, OLD.proposed_version_id, OLD.created_at) THEN
    RAISE EXCEPTION 'RegistrationCorrectionVersion identity and references are immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state <> 'DRAFT' AND (
    NEW.reason, NEW.basis, NEW.disposition, NEW.before_summary, NEW.after_summary, NEW.affected_references
  ) IS DISTINCT FROM (
    OLD.reason, OLD.basis, OLD.disposition, OLD.before_summary, OLD.after_summary, OLD.affected_references
  ) THEN
    RAISE EXCEPTION 'Submitted RegistrationCorrectionVersion content is immutable' USING ERRCODE = '23514';
  END IF;
  IF OLD.state IN ('APPROVED', 'REJECTED', 'WITHDRAWN', 'RETURNED') AND NEW.state IS DISTINCT FROM OLD.state THEN
    RAISE EXCEPTION 'Terminal RegistrationCorrectionVersion state is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER registration_correction_version_immutable
  BEFORE UPDATE OR DELETE ON registration_correction_version
  FOR EACH ROW EXECUTE FUNCTION preserve_registration_correction_version();

CREATE FUNCTION guard_registration_correction_segment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent_id UUID;
  parent_state TEXT;
BEGIN
  parent_id := COALESCE(NEW.correction_version_id, OLD.correction_version_id);
  SELECT state INTO parent_state FROM registration_correction_version WHERE id = parent_id;
  IF parent_state IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION 'RegistrationCorrectionSegment cannot be modified after draft state' USING ERRCODE = '23514';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER registration_correction_segment_guard
  BEFORE INSERT OR UPDATE OR DELETE ON registration_correction_segment
  FOR EACH ROW EXECUTE FUNCTION guard_registration_correction_segment();

COMMIT;
