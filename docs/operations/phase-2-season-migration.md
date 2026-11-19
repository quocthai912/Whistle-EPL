# PHASE 2 Season schema migration

This procedure applies the additive PHASE 2 Season and regulation schema. It does not
provide operational competition names or regulation content. A populated database needs
an accountable, reviewed `competitionName` value for every existing Season before
`pnpm db:migrate` runs.

## Fresh database

For a new database with no Season rows, run the normal migration command:

```powershell
pnpm db:migrate
pnpm db:status
```

No staging relation is needed. The migration creates the schema without inserting any
Season, regulation case, or effective rule.

## Populated database

1. Select the protected database through the deployment's existing secret/configuration
   mechanism. Do not put its URL or password in command arguments, logs, or this file.
2. Stop or drain application writes while staging and applying the migration. The staged
   mapping must cover the same complete Season set that the migration makes non-null.
3. Obtain and review the real `competitionName` for each existing Season against the
   accountable source. Do not infer it from the Season code, display name, date, or a test
   fixture. Resolve missing/conflicting source values before proceeding.
4. On that same database, create the staging relation and insert exactly one mapping per
   existing Season. Stage the mapping before the normal migration command; migration 0001
   adds the nullable target column and migration 0002 consumes the staged values before
   applying `NOT NULL`.

```sql
SELECT current_schema() AS migration_schema;

BEGIN;
CREATE TABLE phase2_season_competition_name_backfill (
  season_id uuid PRIMARY KEY
    REFERENCES season(id) ON DELETE RESTRICT,
  competition_name text NOT NULL
    CHECK (char_length(btrim(competition_name)) BETWEEN 1 AND 200)
);
-- Insert reviewed source values for every current Season, using its exact UUID.
-- Do not substitute a shared or guessed default.
INSERT INTO phase2_season_competition_name_backfill (season_id, competition_name)
VALUES
  ('<reviewed-season-uuid-1>', '<reviewed-competition-name-1>'),
  ('<reviewed-season-uuid-2>', '<reviewed-competition-name-2>');
COMMIT;
```

The placeholders above are illustrative and are not executable values. Use a generated
statement or a bound-parameter database tool for the actual reviewed rows. Before
migrating, verify the current counts match and that no Season is absent:

```sql
SELECT
  (SELECT count(*) FROM season) AS season_count,
  (SELECT count(*) FROM phase2_season_competition_name_backfill) AS mapping_count;

SELECT s.id
FROM season AS s
LEFT JOIN phase2_season_competition_name_backfill AS m
  ON m.season_id = s.id
WHERE m.season_id IS NULL;
```

Require that the displayed schema is the same schema used by `pnpm db:migrate`, equal
counts, and zero rows from the second query. The migration also checks the counts,
validates every resulting value, and fails transactionally if the map is
incomplete or a Season has no valid name. It consumes and drops the staging relation when
successful.

Then use the ordinary deployment workflow on the same selected database:

```powershell
pnpm db:migrate
pnpm db:status
```

Require all migrations to be applied and status to be up to date before releasing the
application. If migration fails, keep writes drained and inspect both the database state
and Prisma's `_prisma_migrations` record. After verifying that the failed migration's SQL
rolled back completely and correcting the reviewed staging data through the approved
operator process, resolve that exact failed migration as rolled back, then retry the
standard deploy command. Substitute the exact failed migration ID below:

```powershell
pnpm --filter @whistle-epl/backend exec prisma migrate resolve --rolled-back <exact-failed-migration-id>
pnpm db:migrate
pnpm db:status
```

Do not mark a failed migration as applied or edit Prisma migration history manually.

## Verification boundary

Isolated synthetic mappings verify the migration mechanism only. They do not satisfy the
deployment requirement for actual Season values or authorize a production mapping.
