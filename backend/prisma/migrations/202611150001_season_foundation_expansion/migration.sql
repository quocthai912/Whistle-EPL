BEGIN;

ALTER TABLE season
  ADD COLUMN competition_name TEXT,
  ADD COLUMN statistics_revision BIGINT NOT NULL DEFAULT 0;

ALTER TABLE season
  ADD CONSTRAINT season_competition_name
    CHECK (competition_name IS NULL OR char_length(competition_name) BETWEEN 1 AND 200),
  ADD CONSTRAINT season_statistics_revision
    CHECK (statistics_revision >= 0);

COMMIT;
