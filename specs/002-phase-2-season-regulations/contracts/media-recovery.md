# PHASE 2 Club Media and Recovery Contract

**Status**: Local-profile design approved with the Plan on 2026-11-10 under LOGO-01/D087/D088/D094/D097; no storage
operation or recovery drill is executed by this document. Optional Supabase remains an
approved alternative requiring its own selected-profile configuration/object recovery, not a
mandatory second implementation or API-provider choice here.

## Upload, reference switching and delivery

Use existing Nest bounded single-file handling and locked sharp. Enforce the 2,097,152-byte
limit while receiving, not after unbounded buffering; reject unexpected fields/files and
unsupported content. Inspect actual format/dimensions/frame metadata, reject animation,
SVG/GIF, corruption and dimensions over 2048 either side, then decode/normalize. Reject
oversized dimensions rather than resize them into compliance. Normalize valid content to
static WebP with stripped metadata and safe generated opaque names; the normalized result
must also meet the approved size/dimension limits. Input PNG/JPEG/WebP acceptance is unchanged.

Use immutable generated object keys under the configured protected local root, never original
filenames/client paths. Prevent traversal/symlink escape; only backend and authorized operator
access the root. Files are outside executable/Git/public-static directories. Compose mounts
a persistent media volume/bind only into the backend and approved operator recovery context;
Caddy never serves that directory. Add documented MEDIA_STORAGE_PROFILE=local and absolute
MEDIA_ROOT/OPS_MEDIA_ROOT mappings in protected runtime configuration.

The Registry application operation owns Club permission/revision/reference changes; Media
validates/stores and returns exact safe metadata. Persisted staging and final switching must
remain under maintenance admission. For the bounded local operation, use one admitted owning
unit through content storage, final fresh authority/revision checks and reference/audit commit;
honor database transaction timeout and report storage/timeout failure without switching.
Pure in-memory decode may precede persisted staging, but cannot authorize the final write.

On replacement, write complete normalized content before the new reference; atomically add
MediaAsset/change currentLogoId/mark old unreferencedAt/advance revision/append audit. Failure
leaves the old current reference and a possible new orphan. Do not delete old content in the
replacement transaction or claim filesystem writes rolled back with SQL.

Backend GET /media/{assetId} checks current pointer and current public/profile-read scope at
each read, with correct MIME, no-store and no storage URL/path/credentials. An old identifier
stops serving content after replacement/removal. A read/reference-change race is linearized
under the same owning Club read/write synchronization before byte delivery; requests already
authorized before replacement do not confer future access. No browser signed/public bucket URL.
Controlled content-read failures map to safe responses and the frontend fallback.

## Cleanup and orphan accounting

- Daily job enters maintenance admission and uses the owning aggregate/asset synchronization.
  Recheck current references, in-flight operations and protected retained backup content.
- Eligible known assets have unreferencedAt at least 24 hours ago; contentDeletedAt records
  verified successful deletion only. Deletion failure keeps metadata for later retry.
- A content file left without a committed asset row is discovered by bounded inventory;
  protected operator-state orphan tracking records first observation. Wait >=24 hours from
  that observation and recheck before deletion, never use file creation age as the sole basis.
  This is technical cleanup metadata, not a new sporting profile/availability history table.
- Backup-protected content may be deleted operationally only when an independently verified
  copy exists inside each retained set that needs it. Cleanup and retention pruning coordinate
  so neither removes the last required copy. Business audit/asset metadata are retained.

## Backup set extension

The current foundation format explicitly rejects Club/MediaAsset schema and requires no media.
Extend existing set-format.py, backup.sh, restore.sh, verify-set.sh, verify-foundation.sh,
common.sh and backend MaintenanceService.verify together rather than adding a parallel tool.

Version 2 uses scope `available-phase-2`, the existing database dump/inventory/manifest/checksum
base files plus a controlled media directory. Manifest records formatVersion, operation/set
identity, application revision, exact migration inventory, snapshot instant and every included
asset's ID/provider/object key, normalized MIME/dimensions/bytes/checksum. Paths are relative
to the set and validated against a fixed generated layout; reject absolute/traversal/symlink,
duplicate or unexpected entries. Secret runtime configuration is never part of the set.

Under the existing closed/drained writer boundary, snapshot the database and all undeleted
stored asset rows/content required by that snapshot. Validate each expected file and checksum;
untracked filesystem orphans are not a business reference or permission to omit a referenced
asset. Missing referenced content fails completion. A completion marker is written only after
all inventories/checksums verify. Incomplete sets never count toward successful backups or
the retained minimum. Preserve the existing 24-hour schedule and >=7 separate retained sets.

Retain strict version-1 available-foundation verification for its matching application/schema.
Do not declare v1 media-complete, silently reinterpret its empty inventory or restore it into
the expanded schema. Version-dispatch errors fail closed. A legacy recovery uses a matching
legacy release and separately reviewed migration path; no automatic cross-version conversion
or rollback migration is introduced here.

## Restore and release

Validate set identity, completion, schema/application compatibility, inventories and all file
hashes before destructive steps. Stage the complete database/content from the same set;
never combine the newest dump with another set's images. Keep host/database maintenance
closed while replacing content/database and verifying restored typed relationships, current
references, checksums, counters, audit and migration state.

If interrupted between database/content replacement, remain closed with a resumable operation
identity and staging/verification state. Restart/resume cannot release partial recovery or
overwrite the wrong target. Only verified recovery permits existing controlled maintenance
release; old browser sessions remain invalid and fresh login is required. Reuse isolated target
guards and current off-host rules for a selected Internet deployment. PHASE 2 demonstrates
available-data/media restoration; full-season <=30-minute BM-07 evidence remains PHASE 10.

## Verification seams and inputs

Required: real valid/invalid logo files, 20 authorized club-logo assets/provenance, declared
protected root/UID/storage capacity and a separate isolated restore target. Synthetic controlled
assets may test validation/failure behavior; do not claim real-club asset usage rights without
evidence. A missing authorized asset blocks its acceptance check, not design completion.

Extend ops/backup/tests/test_set_format.py failure cases and real available-data
drills: nonempty media sets, corruption/missing files, traversal/symlinks, wrong schema/profile,
backup/upload and cleanup/retention races, interrupted restore, failed replacement and fresh login.
Required suites are mapped in [verification.md](../verification.md), not executed here.
