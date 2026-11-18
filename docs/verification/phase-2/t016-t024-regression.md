# PHASE 2 T016–T024 verification

| Tasks | Coverage |
| --- | --- |
| T016, T020 | PostgreSQL-backed master creation, duplicate-name review, normalized codes, scoped correction impact, revision checks, history and pagination. Browser flows exercise the MH13 and MH17 forms with the shared administration controls. |
| T017, T018 | Actual WebP bytes and current-reference delivery, replacement, removal, scoped access, failure rollback, detached-content deletion with a retained copy and the orphan observation clock. Image unit tests cover supported static formats, animation, corruption and size limits. |
| T019 | Linux operator commands against PostgreSQL 17 with a populated media set and a synthetic WebP file. An unsafe destination stopped the first restore after database replacement, with maintenance still active. Resuming the same set restored the recorded Club row and byte-identical media, revoked old sessions and released maintenance. Format tests cover matching releases and corrupted or missing media. |
| T021, T022 | PostgreSQL lock barriers around final new-use checks, independent audit and revision checks, and Club and Stadium confirmation and history flows. Later-owner commitments are simulated in the verification fixture. |
| T023, T024 | Actual lifecycle rows, a confirmed summary and independently authenticated managers. Simulated later-owner facts cover readiness changes while approval waits. The browser exercises draft creation from MH11 and the visible closing blocker. |

The browser fixture uses a dedicated PostgreSQL database and an HTTPS certificate pinned to the test browser process. The operator rehearsal uses a separate database, filesystem and synthetic media. Production closure requires real readiness facts. PHASE 2 acceptance and later operational drills are tracked separately.

## Results

- PostgreSQL integration passed all 156 cases. A targeted rerun also passed both media cases after adding storage and audit failure assertions.
- Backend unit tests passed all 61 cases. The frontend run passed 83 cases, and both availability cases passed on a targeted rerun after the fixture was corrected to await session bootstrap.
- Playwright passed all 56 cases across Chrome and Edge, with 28 per browser.
- Backup and scheduler unit tests passed all 11 cases. The Linux operator rehearsal covered nonempty media, interrupted restore, resumption and session invalidation.
- Build, typecheck, lint, format and diff checks passed. Independent Standards and Spec reviews identified no hard violations or actionable spec discrepancies.
- The supplemental Phase 1 `verify:commands` suite passed 8 of 10 probes. Its two deliberately failing `pnpm test` invocations exceeded the 180-second Windows subprocess limit. The unit suite results above come from direct runs.
