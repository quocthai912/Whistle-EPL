# Club logos and player profile images

**Status:** LOGO-01 APPROVED; club/player media scope CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok). Player-portrait policy is confirmed separately in D069; remaining technical/operational contracts are listed below. Implementation/acceptance is not established.

This is current Context Package content. V1 is the approved Git milestone, not a separate document set to preserve in the working tree. The source PDF is unchanged.

## First-version scope

- Support a full Premier League season of 20 clubs, each with its own managed logo, and hundreds of player profiles with managed profile images. [D060](../use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts)'s smaller supported configurations remain available; first-version acceptance must cover the complete 20-club case.
- Logos belong to shared club masters under UC07; player images belong with player profiles under UC09. They are actual managed data, not frontend mappings or decorative mockups.
- Player-facing views combine profile data with the applicable seasonal club, shirt number and registration information. [D035](../business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information)/[D056](../use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers)'s master/registration distinction remains intact; club and shirt number are not silently made permanent player-master identity fields.
- Backend, database references and frontend rendering must support managed images with fallback when absent or unavailable. Appropriate club/player lists, profiles, schedules, results, standings and lookup views use consistent presentation.
- Core business operation and media management are independent of external football/media-data acquisition APIs. The optional remote storage dependency is governed separately by the environment-specific policy below. No club/player lists are hardcoded in the frontend.
- A newly created or incomplete profile can use fallback. Acceptance of the full-season dataset must nevertheless demonstrate actual logos for all 20 participating clubs and managed player-photo functionality at hundreds-of-profiles scale. [D090](../quality.md#d090---reproducible-acceptance-datasets-and-season-fixtures) fixes the full-season acceptance baseline at at least 600 Player Profiles; authorized asset sources remain to be specified.
- Seasonal kit colors and clothing images are outside the requested first-version scope. [D078](../business.md#d078---xlsx-create-only-import-and-controlled-export) excludes embedded images and automatic external image downloads from structured data exchange.

## LOGO-01 - Approved logo design

**Confirmation:** The Team Leader explicitly approved the entire proposed foundation package plus option A, keeping all proposed rules. This decision is separate from [D001](architecture.md#d001---modular-layered-monolithic-backend)-[D091](../business.md#d091---fixed-xlsx-templates-and-bounded-data-exchange).

- Store logo files under the [environment-specific media storage policy](#environment-specific-media-storage), amended by D087. PostgreSQL retains references/metadata; the backend manages receipt and image delivery. This selects no general file-management platform or image-processing library.
- Accept static PNG, JPEG and WebP, at most 2 MiB (2,097,152 bytes) and at most 2048 pixels on either dimension. Reject SVG, GIF and animated images.
- Validate byte size, actual file type, successful decoding and dimensions; normalize images server-side and generate new filenames. Extension or client-supplied MIME alone is insufficient. No specific image library or version is selected.
- The separately assigned shared club-management permission under [D034](../use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions) authorizes upload, replacement and removal to fallback. [D037](../use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions)-[D041](../use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked), session checks and [D030](architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes) final write authorization still apply. Record operator, time and before/after references. No automatic business permission comes from a seasonal or system-administrator role.
- Switch the reference only after the new image is validated and stored successfully; failure preserves the old logo. Use common rendering, preserved aspect ratio, club-name alternative text and missing/load-failure fallback.
- Back up and restore both metadata and actual logo files; database-only backup is insufficient. The coordinated backup/restore contract is owned by [D088](architecture.md#d088---coordinated-backup-sets-and-controlled-restore); exact scheduling/configuration remains open.
- Use the current club logo consistently even on old-season pages. This is an explicit logo-only exception/addition to [D059](../business.md#d059---required-registration-data-and-official-snapshot-milestones)'s seasonal descriptive lookup. Retain change logs, without requiring old image files to reconstruct each season. Existing names, official snapshots, results and statistics retain their approved historical treatment.
- Logo absence is supported by fallback rather than making an image mandatory for every profile-save operation.

**Trade-off:** Current branding was chosen over historical-image snapshots to keep first-version storage and display simple and consistent. The accepted cost is that old-season pages can display today's logo. This logo decision did not automatically settle player-image policy; D069 below now explicitly confirms current-portrait display.

## Player-image policy

### D069 - Managed player portraits with current-image display

**Status:** CONFIRMED by the Team Leader, Q69 option A and the common package. [Approval and rationale](../../../docs/adr/0015-managed-club-logos-in-first-version.md#q69---managed-player-portraits).

- **Ownership:** A player master has at most one current portrait. A club transfer does not create a new portrait record for the player; club, shirt and registration information remain seasonal.
- **Authority:** The separately granted player-master management permission under D034 authorizes upload, replacement and removal within UC09. Club-logo management does not grant player editing. Existing session/permission lifecycle rules and the D030 final session/authority check apply.
- **Storage and validation:** Reuse the logos' [environment-specific storage policy](#environment-specific-media-storage), with backend receipt/delivery and backup/restore of both image content and PostgreSQL references/metadata. Explicitly apply LOGO-01's validation contract to portraits: static PNG/JPEG/WebP, at most 2 MiB (2,097,152 bytes), at most 2048 pixels per dimension, no SVG/GIF/animation, actual size/type/decode/dimension checks, server normalization and generated filenames. D069 itself selects no image library or endpoint; D087 subsequently permits the storage alternative below.
- **Safe changes:** Switch the reference only after successful validation/storage; failure preserves the old image. Removal uses fallback. Record operator, time and before/after references.
- **Presentation and access:** Use consistent aspect-preserving display, player-name alternative text and missing/load-failure fallback. Display portraits in authorized public lookup views without exposing internal profiles. Missing portraits do not block profile saving or registration-validity confirmation.
- **Historical views:** Use the current portrait even on old-season pages. Retain change logs without requiring old image files to reconstruct each season. This explicitly extends D059's media exception to player images; historical names, club/shirt registration facts, reports and statistics keep their existing snapshot rules. An image change does not itself revise those facts or registration decisions.
- **Remaining work:** Exact delivery/storage/cleanup and D088 backup implementation details, concrete fixture contents under D090 and authorized asset sources remain open; API research/selection remains gated by independent core acceptance under INT-01.

## Environment-specific media storage

**Approval:** The Team Leader explicitly supplemented Q87/D087 with permission to use Supabase Storage for Internet deployment. This amends only the storage-location restriction of LOGO-01/D069; their authority, validation, safe-change, display and historical rules remain in force. [Amendment evidence](../../../docs/adr/0015-managed-club-logos-in-first-version.md#q87---environment-specific-media-storage-amendment).

- **Selection:** Retain durable server-file storage outside the repository/executable area, using persistent volumes for local development and the Docker Compose profile. An Internet environment may instead use Supabase Storage for club logos and player portraits. Select storage through environment configuration; simultaneous local/remote storage, dual writes and automatic failover are not required.
- **Ownership:** PostgreSQL remains the owner of media references and metadata, sufficient to locate content in the configured storage. This does not adopt Supabase Database or Auth, migrate application accounts, or choose a storage SDK, bucket layout or image library.
- **Controlled access:** The backend continues to own upload, session/authority checks, actual-file validation/normalization, replacement, removal, audit and authorized image distribution under LOGO-01/D069 and D030. Keep storage credentials server-side and outside Git/client output. Public storage access must not provide a route around those checks or expose restricted profile media. Choosing remote storage does not relax any existing media permission or delivery rule.
- **Durability and recovery:** Persist media across application/container replacement. Back up and restore actual files/objects together with the corresponding PostgreSQL references/metadata for the selected storage environment. Database-only backup is insufficient. [D088](architecture.md#d088---coordinated-backup-sets-and-controlled-restore) owns coordinated backup sets, maintenance, retention and restore verification. Provider-specific implementation/configuration and cleanup details remain open under that contract and existing quality thresholds.
- **Failure:** Failed replacement preserves the previous current reference; missing/unavailable images use the approved fallback. Remote storage unavailability does not authorize metadata corruption, permission bypass or implicit local failover. Media operations requiring unavailable storage can fail with clear feedback; core non-media business continues independently of football-data providers.
- **Integration boundary:** Supabase Storage is an approved optional storage infrastructure service, separate from INT-01's later football/media-data API research and selection. The local profile supports independent core/media acceptance. If the Internet profile selects remote storage, verify its authorized delivery, failure/fallback and recovery behavior for that selected profile; selecting an option does not require deploying both profiles. No storage integration is implemented during this Context stage.

Technical references: Supabase documents [storage access control](https://supabase.com/docs/guides/storage/security/access-control), [public/private bucket behavior](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [database backup scope](https://supabase.com/docs/guides/platform/backups). Detailed access and backup mechanisms must preserve the approved backend boundary and include actual stored objects.

## Existing Use Cases and Phase ownership

UC07 owns club-logo actions and UC09 player-profile images. See the current [UC flows](../use-cases/registration.md) and [Progress Checker](../progress-checker.md) for ownership and acceptance evidence. The existing six actors and 25 Use Cases remain unchanged.

## External integration boundary

The confirmed media-only gate is in [integration policy](integrations.md). LS-01 excludes Live Score from the first version and cancels its interview/design work; media supplementation remains subject to independent acceptance before API research/selection. Current branding does not authorize external overwrites or bypass media authorization/validation. Data and image use must respect usage rights.

Technical reference: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), supporting layered validation and controlled storage/access; the project limits above come from LOGO-01 approval.

See [ADR 0015](../../../docs/adr/0015-managed-club-logos-in-first-version.md), [glossary](../GLOSSARY.md) and [decision navigation](README.md).
