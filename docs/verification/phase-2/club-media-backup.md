# PHASE 2 Club, Stadium, and media-schema verification

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T003 schema, fixture-reset, and no-assets
backup-path evidence. This is isolated verification; it does not authorize production media
storage, nonempty-media deployment, or PHASE 2 acceptance.

## Schema and migration

The additive migration `202611150003_club_stadium_media_asset` adds `club`, `stadium`, and
Club-owned `media_asset` tables. It preserves unique immutable Club/Stadium IDs and codes,
nullable discontinuation/current-logo and media lifecycle markers, the actual Club/Account
foreign keys, and same-owner composite current-logo reference. Media metadata is retained;
the schema has no Player table or Player foreign key. The storage columns constrain the
Phase 2 profile to local normalized WebP metadata and the approved size/dimension bounds.

On the disposable PostgreSQL 17.11 instance `whistle-phase2-01a1de46` at loopback
`127.0.0.1:50743`, fresh isolated database `whistle_test_phase2_t003_final` received all 10
current migrations through ordinary `pnpm db:migrate`. `pnpm db:status` reported up to date;
`prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
--exit-code` returned an empty migration. Credentials are omitted.

| Check | Result |
|---|---|
| Prisma schema validate and client generate | PASS, Prisma 7.10.1. |
| Focused migration replay and Prisma drift check in `schema.spec.ts` | PASS, 7/7 tests. Covers immutable Club/Stadium IDs and codes, nullable Stadium location, required Club name/abbreviation, actual Club/Account foreign keys, same-owner current-logo enforcement, media uniqueness and profile bounds, retained metadata, and absence of Player. |
| Fixture reset without `CASCADE` | PASS, `fixture-isolation.spec.ts` 2/2 tests. The test inserts a Club, Stadium, MediaAsset, and real current-logo pointer, then verifies all three tables and their dependent Phase 2 rows are empty after the acknowledged reset. |
| Focused backend ESLint and typecheck | PASS. |
| `git diff --check` | PASS; Git reports an existing working-copy CRLF normalization notice for the concurrently edited ops test file. |

## Expanded-schema no-assets recovery path

The coordinating operator verified the final migration and backend image in the independent
disposable target `whistle_test_phase2_t003_restore2`. It held one Club, one Stadium, and no
MediaAsset rows, with all 10 current migrations installed. The Linux verifier ran with a
protected operator configuration and a non-root account. `backup.sh` followed by
`verify-foundation.sh` completed same-set restore, inventory comparison, zero-active-session
verification, and corrupt-set refusal.

The produced v2 manifest identified scope `available-phase-2`, an empty media inventory,
the 10 migration hashes, the backend image identity, and a UTC snapshot time. This proves the
no-assets expanded-schema path only. Nonempty-media backup/restore still depends on authorized
assets and T019. The operational media root, production owner/UID, and capacity are not
established by this isolated drill.

The legacy profile was separately checked on `whistle_test_phase2_legacy_restore` with the
matching archived backend image and the exact seven baseline migrations. The current scripts
completed backup, same-set restore, inventory comparison, zero-active-session verification,
and corrupt-set refusal; the format result was `1 available-foundation 0`. This confirms the
v1 dispatcher continues to recognize only its matching legacy profile.

The coordinating operator passed Bash syntax checks and ran
`python3 -m unittest discover -s ops/backup/tests` in the isolated Linux verifier.

## Follow-up review

The Standards and Spec reviews found gaps in the verifier's foreign-key checks, trigger
checks, and operator configuration instructions. The verifier now checks the source and
target tables, ordered column pairs, referential actions, validation state, and enabled
identity and metadata triggers. The [backup runbook](../../operations/backup-format.md)
describes the protected `OPS_APP_REVISION` input for v2 and the matching legacy v1 path.

The catalog regression and all other ops unit tests passed, 10/10. The v2 drill passed
again on `whistle_test_phase2_t003_restore2` with the updated scripts mounted read-only
in the Debian 12 verifier. The manifest recorded the latest run's snapshot instant
`2026-11-15T09:59:47Z` and the tested backend image
`sha256:fccebbd21070722b26140830843ce8c39a40bdca9828d53cfe6b3c1d23f6797a`.
