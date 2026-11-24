-- Allow D057 historical correction segments with missing historical regulation basis (INSUFFICIENT_BASIS)
-- to record NULL regulation_version_id instead of misattributing a fallback regulation.
ALTER TABLE "registration_correction_segment"
  ALTER COLUMN "regulation_version_id" DROP NOT NULL;
