# Club logos and player profile images

**Status:** LOGO-01 APPROVED; club/player media scope CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok). Player-image design details listed below remain open. Implementation/acceptance is not established.

This is current Context Package content. V1 is the approved Git milestone, not a separate document set to preserve in the working tree. The source PDF is unchanged.

## First-version scope

- Support a full Premier League season of 20 clubs, each with its own managed logo, and hundreds of player profiles with managed profile images. [D060](../use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts)'s smaller supported configurations remain available; first-version acceptance must cover the complete 20-club case.
- Logos belong to shared club masters under UC07; player images belong with player profiles under UC09. They are actual managed data, not frontend mappings or decorative mockups.
- Player-facing views combine profile data with the applicable seasonal club, shirt number and registration information. [D035](../business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information)/[D056](../use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers)'s master/registration distinction remains intact; club and shirt number are not silently made permanent player-master identity fields.
- Backend, database references and frontend rendering must support managed images with fallback when absent or unavailable. Appropriate club/player lists, profiles, schedules, results, standings and lookup views use consistent presentation.
- Core business operation and media management are independent of external APIs. No club/player lists are hardcoded in the frontend.
- A newly created or incomplete profile can use fallback. Acceptance of the full-season dataset must nevertheless demonstrate actual logos for all 20 participating clubs and managed player-photo functionality at hundreds-of-profiles scale. Exact player dataset size and authorized asset sources remain to be specified.
- Seasonal kit colors and clothing images are outside the requested first-version scope. Exported-image requirements remain part of the report/export contract.

## LOGO-01 - Approved logo design

**Confirmation:** The Team Leader explicitly approved the entire proposed foundation package plus option A, keeping all proposed rules. This decision is separate from [D001](architecture.md#d001---modular-layered-monolithic-backend)-[D068](../use-cases/publication.md#d068---public-season-overview-dashboard).

- Store logo files in durable server storage outside the repository and executable file area; PostgreSQL retains references/metadata. The backend manages receipt and image delivery. No cloud service or general file-management platform is selected.
- Accept static PNG, JPEG and WebP, at most 2 MiB (2,097,152 bytes) and at most 2048 pixels on either dimension. Reject SVG, GIF and animated images.
- Validate byte size, actual file type, successful decoding and dimensions; normalize images server-side and generate new filenames. Extension or client-supplied MIME alone is insufficient. No specific image library or version is selected.
- The separately assigned shared club-management permission under [D034](../use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions) authorizes upload, replacement and removal to fallback. [D037](../use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions)-[D041](../use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked), session checks and [D030](architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes) final write authorization still apply. Record operator, time and before/after references. No automatic business permission comes from a seasonal or system-administrator role.
- Switch the reference only after the new image is validated and stored successfully; failure preserves the old logo. Use common rendering, preserved aspect ratio, club-name alternative text and missing/load-failure fallback.
- Back up and restore both metadata and actual logo files; database-only backup is insufficient. Exact operational schedule/tools remain governed by the pending operations design.
- Use the current club logo consistently even on old-season pages. This is an explicit logo-only exception/addition to [D059](../business.md#d059---required-registration-data-and-official-snapshot-milestones)'s seasonal descriptive lookup. Retain change logs, without requiring old image files to reconstruct each season. Existing names, official snapshots, results and statistics retain their approved historical treatment.
- Logo absence is supported by fallback rather than making an image mandatory for every profile-save operation.

**Trade-off:** Current branding was chosen over historical-image snapshots to keep first-version storage and display simple and consistent. The accepted cost is that old-season pages can display today's logo. This exception does not apply automatically to player images.

## Player-image scope and remaining decisions

The Team Leader confirms managed player images as mandatory first-version functionality. UC09 ownership uses existing player-profile management authority; club-logo permissions do not grant player editing authority.

The following are not selected merely by approving LOGO-01: applying identical file/size limits to player images, current versus historical portrait rendering, image-specific action details and retention. Reusing the approved media mechanism is a design candidate; record material policy choices only after confirmation. No provider, image library or upload endpoint has been selected.

## Existing Use Cases and Phase ownership

UC07 owns club-logo actions and UC09 player-profile images. See the current [UC flows](../use-cases/registration.md) and [Progress Checker](../progress-checker.md) for ownership and acceptance evidence. The existing six actors and 25 Use Cases remain unchanged.

## External integration boundary

The confirmed media-only gate is in [integration policy](integrations.md). LS-01 excludes Live Score from the first version and cancels its interview/design work; media supplementation remains subject to independent acceptance before API research/selection. Current branding does not authorize external overwrites or bypass media authorization/validation. Data and image use must respect usage rights.

Technical reference: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), supporting layered validation and controlled storage/access; the project limits above come from LOGO-01 approval.

See [ADR 0015](../../../docs/adr/0015-managed-club-logos-in-first-version.md), [glossary](../GLOSSARY.md) and [decision navigation](README.md).
