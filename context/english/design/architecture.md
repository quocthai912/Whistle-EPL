# Architecture and shared technical contracts

Owns approved stack, layering, time representation and final write authorization. Only the decisions below are selected; modules, ERD/schema, session technology and deployment details still await design. See [open work](../open-decisions.md).

### D001 - Modular, layered monolithic backend

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0001-modular-layered-backend.md#d001-english-evidence).

- **Source:** O12; CN-01-CN-04, PDF p.26; centralized data constraint in §1.2.6.1; three-member team and source project plan in §1.5 pp.50-52.

- **Decision:** One backend deployed as a single unit, organized into business modules with clear request-handling, business-processing and data-access responsibilities; one centralized relational database.

### D002 - Approved technology stack and API style

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0002-approved-technology-stack.md#d002-english-evidence).

- **Source:** O12; CN-01-CN-04, PDF p.26; Q2 confirmation. The selection principle prioritizes technologies the team has practiced, subject to course constraints. The confirmation does not establish individual members' experience or additional course constraints.

- **Decision:** Frontend: React + TypeScript. Backend: NestJS + TypeScript. Database: PostgreSQL. ORM: Prisma ORM. API style: REST API. Architecture: Modular Monolith combined with Layered Architecture, consistent with [D001](architecture.md#d001---modular-layered-monolithic-backend).

- **Consequences:** Chapter 3 design and subsequent implementation planning use this approved stack. Module boundaries, the PostgreSQL schema, Prisma mappings and REST contracts must be designed consistently with it.

### D024 - UTC instants and a single Vietnam display/input time zone

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0006-utc-instants-and-vietnam-time-zone.md#d024-english-evidence).

- **Source:** O03/O12 and cross-cutting O07/O08; TT-04, PDF p.19; time-related scheduling/registration/regulation/delegation requirements. This is an explicitly confirmed v2 design policy, not a time zone specified by the PDF.

- **Decision:** Store and compare exact instants using UTC. Use Asia/Ho_Chi_Minh consistently for time entry and display across the system, including match schedules, registration deadlines, regulation/delegation effectivity and activity history. Clearly label the time zone and do not automatically switch to the user's device time zone.

- **Date-only values:** Preserve dates without a time component, such as dates of birth and U21 birth-date cutoffs, as calendar-date values without time-zone conversion. This does not select the actual seasonal cutoff dates or deadline values.

### D030 - Recheck current session and authority at the final decision point of writes

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0007-final-authorization-check-for-writes.md#d030-english-evidence).

- **Source:** O07/O08/O12; BM-01/BM-02 and CN-02, PDF pp.23/26; AT-02/AT-03, p.32; [D007](../use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)-[D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).

- **Decision:** For internal write operations, check permission when receiving the request and recheck the current session, authority and validity period at a final decision point inside the transaction before successfully recording the change. Starting with valid permission is insufficient if the session/authority is no longer valid at that final point.

- **Failure and consistency:** If the final check fails, reject and roll back that business transaction without partial business data, statistics or workflow-state changes. Permission revocation and concurrent writes must have a consistent order so an old permission check cannot write past a revocation already in effect. Previously valid completed operations remain unchanged; revocation does not undo them retroactively.

- **Boundary example:** A request received at 11:59:59 using authority expiring at 12:00 must fail if its final authorization check occurs at 12:00:01. The interval boundary is as confirmed in [D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).
