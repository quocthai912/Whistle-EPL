BEGIN;

ALTER TABLE season_lifecycle_version ADD COLUMN readiness_basis TEXT;
ALTER TABLE season_lifecycle_version ADD CONSTRAINT season_lifecycle_readiness_basis
  CHECK (readiness_basis IS NULL OR (
    action = 'CLOSE' AND submitted_at IS NOT NULL
    AND summary_version_id IS NOT NULL AND readiness_basis ~ '^[0-9a-f]{64}$'
  ));

COMMIT;
