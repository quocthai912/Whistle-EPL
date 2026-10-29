BEGIN;

-- Preserve published migration history while hardening retained grant lifecycle facts.
CREATE OR REPLACE FUNCTION preserve_delegation_grant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN
  RAISE EXCEPTION 'Delegation grant history cannot be deleted' USING ERRCODE='23514';
 END IF;
 IF (NEW.approved_version_id,NEW.recipient_id,NEW.season_id,NEW.action_code,NEW.starts_at,NEW.ends_at,NEW.granted_by,NEW.granted_at)
  IS DISTINCT FROM (OLD.approved_version_id,OLD.recipient_id,OLD.season_id,OLD.action_code,OLD.starts_at,OLD.ends_at,OLD.granted_by,OLD.granted_at) THEN
  RAISE EXCEPTION 'Granted delegation basis is immutable' USING ERRCODE='23514';
 END IF;
 IF (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at)
  OR (OLD.revoked_by IS NOT NULL AND NEW.revoked_by IS DISTINCT FROM OLD.revoked_by)
  OR (OLD.terminated_at IS NOT NULL AND NEW.terminated_at IS DISTINCT FROM OLD.terminated_at) THEN
  RAISE EXCEPTION 'Delegation lifecycle history is immutable once recorded' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;

DROP TRIGGER delegation_grant_content ON delegation_grant;
CREATE TRIGGER delegation_grant_content BEFORE UPDATE OR DELETE ON delegation_grant
 FOR EACH ROW EXECUTE FUNCTION preserve_delegation_grant();

COMMIT;
