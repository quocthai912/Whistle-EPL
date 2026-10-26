# ADR 0024 - React frontend tooling and shared UI

**Status:** accepted. **Decision:** D086. The Team Leader selected Q86 option A ("Tôi chọn A."), approving the full common package. Authoritative policy is owned by [D086](../../context/english/design/architecture.md#d086---react-spa-tooling-and-shared-ui-approach).

Choose Vite/React Router with Ant Design standard components and CSS Modules customization instead of building the full component set from CSS Modules alone. This reduces repeated form/table/dialog work for SE104, accepting visual customization to establish the league identity. Use Vietnamese UI, permission-aware public/internal navigation, one Fetch API layer and built-in React state/hooks/context. Preserve the approved Dashboard, timezone, media, conflict and session-clearing behaviors; frontend checks do not replace server authority.

Compatibility capabilities were checked in official documentation for [Ant Design with Vite](https://ant.design/docs/react/use-with-vite/), [React Router](https://reactrouter.com/start/declarative/installation) and [Vite CSS Modules](https://vite.dev/guide/features#css-modules). Versions remain subject to toolchain selection. No separate state/cache library, additional UC, implementation or whole-v2 approval is established.
