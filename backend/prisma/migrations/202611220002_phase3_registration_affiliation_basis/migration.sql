-- Persist the homegrown affiliated-association verification decision independently from
-- non_homegrown_opt_in and decision-time homegrown_finding, and keep it immutable after DRAFT.
ALTER TABLE "registration_version"
  ADD COLUMN "affiliated_association_basis" BOOLEAN;

CREATE OR REPLACE FUNCTION preserve_registration_version() RETURNS trigger LANGUAGE plpgsql AS $$
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
    IF (NEW.shirt_number, NEW.playing_start, NEW.playing_end,
        NEW.non_homegrown_opt_in, NEW.evidence_branch, NEW.qualifying_value, NEW.evidence_summary,
        NEW.evidence_reference, NEW.affiliated_association_basis, NEW.verified_by, NEW.verified_at,
        NEW.notes)
       IS DISTINCT FROM
       (OLD.shirt_number, OLD.playing_start, OLD.playing_end,
        OLD.non_homegrown_opt_in, OLD.evidence_branch, OLD.qualifying_value, OLD.evidence_summary,
        OLD.evidence_reference, OLD.affiliated_association_basis, OLD.verified_by, OLD.verified_at,
        OLD.notes) THEN
      RAISE EXCEPTION 'Submitted or validated RegistrationVersion content is immutable' USING ERRCODE = '23514';
    END IF;
    IF NOT (OLD.state = 'RECEIVED' AND NEW.state = 'VALID') AND
       (NEW.u21_finding, NEW.homegrown_finding) IS DISTINCT FROM (OLD.u21_finding, OLD.homegrown_finding) THEN
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
