# ADR 0025 - Required CI and protected integration branches

**Status:** accepted. **Decision:** D098. **Approver:** Team Leader. **Date:** 2026-10-28 (Asia/Bangkok). Current policy is owned by [D098](../../context/design/architecture.md#d098---required-ci-and-protected-integration-branches); [Phase allocation and readiness](../../context/progress-checker.md#phase-1-specification-readiness-and-foundation-verification) owns the documentation clarifications. This approval follows Q98 and does not extend Q98 retroactively.

PHASE 1 needs an enforceable verification boundary before implementation grows across the three-member team. D097 already selects the stack and test tools but does not determine merge enforcement, execution trust or verification tiers. Choose mandatory GitHub Actions checks and PR-only integration branches over advisory CI or checks only after merge. The policy protects future module/security/transaction contracts across PHASE 1-PHASE 10; weakening it later would change the team's shared merge and evidence assumptions, rather than merely changing YAML.

Require meaningful checks on both Ubuntu and Windows. The Team Leader amended the originally recommended Ubuntu-only mandatory baseline to make Windows mandatory too. Choose PostgreSQL 17 integration on Ubuntu over also provisioning native PostgreSQL on Windows: both platforms verify installation, native dependencies, generation, source quality, unit tests and builds, while Linux validates database behavior for the D097 reference deployment. This accepts no mandatory Windows PostgreSQL integration coverage, reducing provisioning and maintenance cost.

Keep browser/load/install/recovery acceptance separate from the deterministic per-PR suite, rather than running every drill on every PR or deferring all tests until Phase end. This reduces feedback time and performance noise without relaxing acceptance criteria. Read-only, disposable CI without deployment credentials limits the impact of executing PR code; it deliberately does not provide automatic deployment or unrestricted access to operational systems. Standard public-repository runners and branch rules support the policy without requiring a paid service; storage/runtime use still needs bounds.

## Approval evidence

- **Q99:** The Team Leader selected A, requiring both Ubuntu and Windows, CI on PRs into both development and main, and no direct pushes to either branch: "2 branch này được bảo vệ tuyệt đối và chỉ có thể mở PR vào."
- **Q100/Q101/Q102:** The Team Leader selected A for verification tiers, CI trust/isolation and the foundation-versus-full-system operational verification allocation.
- **Q103:** The Team Leader replied "Q103 chọn A nhé.", confirming mandatory Windows source/unit/build checks with PostgreSQL integration on Ubuntu.
- **Final shared understanding:** After reviewing the consolidated decisions and proposed minimal documentation changes, the Team Leader stated: "Tôi chấp nhận bản tổng kết này. Nhớ là chưa tạo Specs nhé." This authorizes decision-document updates only, not Specifications, Plans, Tasks, Issues, application/database/workflow implementation, GitHub settings changes, commit or push.

The approval preserves D001-D097, all source thresholds, Phase statuses and checkboxes. Constitution ratification remains a separate governance action. The foundation verification allocation clarifies existing Phase ownership; no umbrella PHASE 1 ADR or new business term is needed.
