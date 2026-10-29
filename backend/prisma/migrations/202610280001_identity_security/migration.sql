BEGIN;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL,
    "personnel_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'ACTIVE',
    "must_change_password" BOOLEAN NOT NULL,
    "temporary_password_expires_at" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6),
    "auth_revision" BIGINT NOT NULL DEFAULT 1,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "csrf_token" TEXT NOT NULL,
    "account_auth_revision" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL,
    "absolute_expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revocation_reason" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prelogin_csrf_context" (
    "id" UUID NOT NULL,
    "csrf_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),

    CONSTRAINT "prelogin_csrf_context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_throttle_key" (
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "blocked_until" TIMESTAMPTZ(6),
    "last_success_at" TIMESTAMPTZ(6),

    CONSTRAINT "login_throttle_key_pkey" PRIMARY KEY ("kind","key")
);

-- CreateTable
CREATE TABLE "login_failure" (
    "id" UUID NOT NULL,
    "username_key" TEXT NOT NULL,
    "ip_key" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "login_failure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_personnel_code_key" ON "account"("personnel_code");

-- CreateIndex
CREATE UNIQUE INDEX "account_username_key" ON "account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_hash_key" ON "session"("token_hash");

-- CreateIndex
CREATE INDEX "session_account_id_revoked_at_idx" ON "session"("account_id", "revoked_at");

-- CreateIndex
CREATE INDEX "session_absolute_expires_at_idx" ON "session"("absolute_expires_at");

-- CreateIndex
CREATE INDEX "prelogin_csrf_context_expires_at_idx" ON "prelogin_csrf_context"("expires_at");

-- CreateIndex
CREATE INDEX "login_failure_username_key_occurred_at_idx" ON "login_failure"("username_key", "occurred_at");

-- CreateIndex
CREATE INDEX "login_failure_ip_key_occurred_at_idx" ON "login_failure"("ip_key", "occurred_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- C01-C05. PostgreSQL char_length counts Unicode code points, not UTF-16 units.
ALTER TABLE account
  ADD CONSTRAINT account_personnel_code CHECK (personnel_code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  ADD CONSTRAINT account_username CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,49}$'),
  ADD CONSTRAINT account_name CHECK (char_length(full_name) BETWEEN 1 AND 200 AND full_name = normalize(btrim(regexp_replace(full_name, '\s+', ' ', 'g')), NFC)),
  ADD CONSTRAINT account_state CHECK (state IN ('ACTIVE','LOCKED')),
  ADD CONSTRAINT account_revisions CHECK (revision > 0 AND auth_revision > 0),
  ADD CONSTRAINT account_hash CHECK (password_hash ~ '^\$argon2id\$v=19\$m=19456,(t=2,p=1|p=1,t=2)\$[^$]+\$[^$]+$'),
  ADD CONSTRAINT account_uuid CHECK (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
CREATE UNIQUE INDEX account_username_insensitive ON account (lower(username));
CREATE FUNCTION preserve_account_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' OR NEW.personnel_code IS DISTINCT FROM OLD.personnel_code THEN
   RAISE EXCEPTION 'Account identity is permanent' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER account_identity BEFORE UPDATE OR DELETE ON account FOR EACH ROW EXECUTE FUNCTION preserve_account_identity();
ALTER TABLE session
  ADD CONSTRAINT session_token_hash CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT session_csrf CHECK (csrf_token ~ '^[A-Za-z0-9_-]{43}$'),
  ADD CONSTRAINT session_revision CHECK (account_auth_revision > 0),
  ADD CONSTRAINT session_absolute_expiry CHECK (absolute_expires_at = created_at + interval '8 hours'),
  ADD CONSTRAINT session_activity CHECK (last_activity_at >= created_at AND last_activity_at <= absolute_expires_at),
  ADD CONSTRAINT session_reason CHECK (char_length(revocation_reason) <= 2000);
ALTER TABLE prelogin_csrf_context
  ADD CONSTRAINT prelogin_uuid CHECK (id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  ADD CONSTRAINT prelogin_csrf CHECK (csrf_token ~ '^[A-Za-z0-9_-]{43}$'),
  ADD CONSTRAINT prelogin_expiry CHECK (expires_at = created_at + interval '15 minutes');
ALTER TABLE login_throttle_key ADD CONSTRAINT throttle_kind CHECK (kind IN ('USERNAME','IP'));
-- Threshold/window/block/retention are enforced by the later T024 owning module;
-- this table stores trusted failure instants, including unknown usernames.

COMMIT;
