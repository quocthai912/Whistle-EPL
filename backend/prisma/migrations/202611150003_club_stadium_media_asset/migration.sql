BEGIN;

-- CreateTable
CREATE TABLE "club" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "discontinued_at" TIMESTAMPTZ(6),
    "current_logo_id" UUID,
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stadium" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "discontinued_at" TIMESTAMPTZ(6),
    "revision" BIGINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stadium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_asset" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'LOCAL',
    "object_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "stored_by" UUID NOT NULL,
    "unreferenced_at" TIMESTAMPTZ(6),
    "content_deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_code_key" ON "club"("code");

-- CreateIndex
CREATE INDEX "club_name_id_idx" ON "club"("name", "id");

-- CreateIndex
CREATE UNIQUE INDEX "club_id_current_logo_id_key" ON "club"("id", "current_logo_id");

-- CreateIndex
CREATE UNIQUE INDEX "stadium_code_key" ON "stadium"("code");

-- CreateIndex
CREATE INDEX "stadium_name_id_idx" ON "stadium"("name", "id");

-- CreateIndex
CREATE INDEX "media_asset_club_id_created_at_idx" ON "media_asset"("club_id", "created_at");

-- CreateIndex
CREATE INDEX "media_asset_stored_by_idx" ON "media_asset"("stored_by");

-- CreateIndex
CREATE INDEX "media_asset_unreferenced_at_idx" ON "media_asset"("unreferenced_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_provider_object_key_key" ON "media_asset"("provider", "object_key");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_club_id_id_key" ON "media_asset"("club_id", "id");

-- AddForeignKey
ALTER TABLE "club" ADD CONSTRAINT "club_id_current_logo_id_fkey" FOREIGN KEY ("id", "current_logo_id") REFERENCES "media_asset"("club_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_stored_by_fkey" FOREIGN KEY ("stored_by") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE club
  ADD CONSTRAINT club_code CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  ADD CONSTRAINT club_name CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND name = normalize(btrim(regexp_replace(name, '\s+', ' ', 'g')), NFC)
  ),
  ADD CONSTRAINT club_abbreviation CHECK (
    char_length(abbreviation) BETWEEN 1 AND 20
    AND abbreviation = normalize(btrim(regexp_replace(abbreviation, '\s+', ' ', 'g')), NFC)
  ),
  ADD CONSTRAINT club_revision CHECK (revision > 0);

ALTER TABLE stadium
  ADD CONSTRAINT stadium_code CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{0,31}$'),
  ADD CONSTRAINT stadium_name CHECK (
    char_length(name) BETWEEN 1 AND 200
    AND name = normalize(btrim(regexp_replace(name, '\s+', ' ', 'g')), NFC)
  ),
  ADD CONSTRAINT stadium_location CHECK (
    location IS NULL OR (
      char_length(location) BETWEEN 1 AND 500
      AND location = normalize(btrim(regexp_replace(location, '\s+', ' ', 'g')), NFC)
    )
  ),
  ADD CONSTRAINT stadium_revision CHECK (revision > 0);

ALTER TABLE media_asset
  ADD CONSTRAINT media_asset_provider CHECK (provider = 'LOCAL'),
  ADD CONSTRAINT media_asset_object_key CHECK (char_length(btrim(object_key)) BETWEEN 1 AND 200),
  ADD CONSTRAINT media_asset_mime_type CHECK (mime_type = 'image/webp'),
  ADD CONSTRAINT media_asset_byte_size CHECK (byte_size BETWEEN 1 AND 2097152),
  ADD CONSTRAINT media_asset_dimensions CHECK (
    width BETWEEN 1 AND 2048 AND height BETWEEN 1 AND 2048
  ),
  ADD CONSTRAINT media_asset_checksum CHECK (char_length(btrim(checksum)) BETWEEN 1 AND 200),
  ADD CONSTRAINT media_asset_content_deleted_requires_unreferenced CHECK (
    content_deleted_at IS NULL OR unreferenced_at IS NOT NULL
  );

CREATE FUNCTION preserve_shared_master_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Shared master identity is retained' USING ERRCODE = '23514';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'Shared master identity and code are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_identity BEFORE UPDATE OR DELETE ON club
  FOR EACH ROW EXECUTE FUNCTION preserve_shared_master_identity();
CREATE TRIGGER stadium_identity BEFORE UPDATE OR DELETE ON stadium
  FOR EACH ROW EXECUTE FUNCTION preserve_shared_master_identity();

CREATE FUNCTION preserve_media_asset_metadata() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'MediaAsset metadata is retained' USING ERRCODE = '23514';
  END IF;
  IF (NEW.id, NEW.club_id, NEW.provider, NEW.object_key, NEW.mime_type, NEW.byte_size,
      NEW.width, NEW.height, NEW.checksum, NEW.stored_by, NEW.created_at)
     IS DISTINCT FROM
     (OLD.id, OLD.club_id, OLD.provider, OLD.object_key, OLD.mime_type, OLD.byte_size,
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

CREATE TRIGGER media_asset_metadata BEFORE UPDATE OR DELETE ON media_asset
  FOR EACH ROW EXECUTE FUNCTION preserve_media_asset_metadata();

COMMIT;

