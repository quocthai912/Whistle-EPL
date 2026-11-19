BEGIN;

CREATE OR REPLACE FUNCTION validate_regulation_ranking_on_submit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  priority_count INTEGER;
  positions INTEGER[];
BEGIN
  IF NEW.state IN ('SUBMITTED', 'APPROVED_WAITING', 'EFFECTIVE') THEN
    SELECT count(*)::INTEGER, array_agg(position ORDER BY position)
      INTO priority_count, positions
    FROM ranking_priority WHERE regulation_version_id = NEW.id;
    IF priority_count <> 3 OR positions <> ARRAY[1,2,3] THEN
      RAISE EXCEPTION 'Submitted or approved regulation requires contiguous ranking priority' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION guard_current_club_logo() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  marker TIMESTAMPTZ;
BEGIN
  IF NEW.current_logo_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.current_logo_id IS NOT DISTINCT FROM OLD.current_logo_id THEN
    RETURN NEW;
  END IF;

  -- Write the asset row so a concurrent marker update and a logo attachment
  -- serialize on the same row, including under stricter isolation levels.
  UPDATE media_asset SET unreferenced_at = unreferenced_at
    WHERE id = NEW.current_logo_id AND club_id = NEW.id
    RETURNING unreferenced_at INTO marker;
  IF marker IS NOT NULL THEN
    RAISE EXCEPTION 'An unreferenced asset cannot become the current club logo' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION guard_current_logo_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.unreferenced_at IS NULL AND NEW.unreferenced_at IS NOT NULL AND EXISTS (
    SELECT 1 FROM club WHERE id = NEW.club_id AND current_logo_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'A current club logo cannot be marked unreferenced' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER club_current_logo_lifecycle BEFORE INSERT OR UPDATE OF current_logo_id ON club
  FOR EACH ROW EXECUTE FUNCTION guard_current_club_logo();
CREATE TRIGGER media_asset_current_logo_lifecycle BEFORE UPDATE OF unreferenced_at ON media_asset
  FOR EACH ROW EXECUTE FUNCTION guard_current_logo_lifecycle();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM club JOIN media_asset ON media_asset.id = club.current_logo_id
    WHERE media_asset.unreferenced_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Existing current club logo is marked unreferenced' USING ERRCODE = '23514';
  END IF;
END;
$$;

COMMIT;
