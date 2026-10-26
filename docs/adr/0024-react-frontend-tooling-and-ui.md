# ADR 0024 - React frontend tooling and shared UI

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

**Status:** accepted. **Decision:** D086. The Team Leader selected Q86 option A ("Tôi chọn A."), approving the full common package. Authoritative policy is owned by [D086](../../context/design/architecture.md#d086---react-spa-tooling-and-shared-ui-approach).

Choose Vite/React Router with Ant Design standard components and CSS Modules customization instead of building the full component set from CSS Modules alone. This reduces repeated form/table/dialog work for SE104, accepting visual customization to establish the league identity. Use Vietnamese UI, permission-aware public/internal navigation, one Fetch API layer and built-in React state/hooks/context. Preserve the approved Dashboard, timezone, media, conflict and session-clearing behaviors; frontend checks do not replace server authority.

Compatibility capabilities were checked in official documentation for [Ant Design with Vite](https://ant.design/docs/react/use-with-vite/), [React Router](https://reactrouter.com/start/declarative/installation) and [Vite CSS Modules](https://vite.dev/guide/features#css-modules). D097 is the approved version/toolchain baseline and Q98 approves Context v2. Exact pins, compatibility checks and root-script implementation/verification remain PHASE 1 work. No separate state/cache library or additional UC is selected, and no software implementation or acceptance is established.

## Q97 - Versioned baseline and source-quality completion

The Team Leader approved D097 with pnpm-only Workspaces, root lint/typecheck/format commands and EPL-TEST-2026. [D097](../../context/design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations) now owns the selected React/Vite/Router/Ant Design/Day.js baseline and exact-pin verification/development contract. D086 SPA/navigation/Fetch/state and Vietnamese UI policies remain unchanged. Library compatibility and scripts must be implemented and checked in PHASE 1, not inferred from documentation approval.
