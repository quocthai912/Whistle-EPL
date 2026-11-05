BEGIN;

-- Keep the submitted recipient with its version when a returned case changes recipient.
ALTER TABLE delegation_version ADD COLUMN recipient_id uuid REFERENCES account(id) ON DELETE RESTRICT;
UPDATE delegation_version v SET recipient_id = c.recipient_id FROM delegation_case c WHERE c.id = v.case_id;

CREATE FUNCTION preserve_delegation_version_recipient() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.submitted_at IS NOT NULL AND NEW.recipient_id IS DISTINCT FROM OLD.recipient_id THEN
  RAISE EXCEPTION 'Submitted delegation recipient is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER delegation_version_recipient_content BEFORE UPDATE ON delegation_version
 FOR EACH ROW EXECUTE FUNCTION preserve_delegation_version_recipient();

CREATE FUNCTION validate_delegation_version_recipient() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM delegation_version v WHERE v.id = NEW.approved_version_id
            AND v.recipient_id IS NOT NULL AND v.recipient_id <> NEW.recipient_id) THEN
  RAISE EXCEPTION 'Grant recipient differs from submitted version' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER delegation_version_recipient_basis BEFORE INSERT ON delegation_grant
 FOR EACH ROW EXECUTE FUNCTION validate_delegation_version_recipient();

COMMIT;
