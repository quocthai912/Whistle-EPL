# PHASE 3 Validation Guide

Use this guide only after the [execution gate](plan.md#dependency-and-delivery-strategy) is satisfied and the relevant approved Tasks have been implemented. See [verification](verification.md) for scenarios and evidence.

## Prepare isolated targets

1. Record the accepted PHASE 2 revision and evidence for season lifecycle, effective rules and due activation, Club/Stadium D099 and the dependency contracts. Compare those interfaces and schema with the Plan. Stop implementation on an unresolved dependency gap.
2. Use existing package/image pins, Chrome/Edge and same-origin local HTTPS. Prepare separate integration, browser and restore databases plus isolated media/backup roots. Use existing guarded environment and reset conventions from the [PHASE 2 guide](../002-phase-2-season-regulations/quickstart.md). Keep URLs and credentials in protected configuration. Check migration and restore target identity before either operation.
3. Prepare D090/D097 fixtures with authorized images, an Open season with approved effective rules, separate preparers and approvers, restricted accounts, real Club/Stadium references and future/historical interval scenarios. Use isolated guarded setup. For acceptance of actual UC flows, perform the transitions with authorized users and retain resulting evidence.

## Existing validation entry points

Run from repository root with the appropriate isolated target selected. Use the accepted PHASE 2 migration procedure for each target before tests. New PHASE 3 suites must be registered in the existing test runners.

```powershell
pnpm install --frozen-lockfile
pnpm db:validate
pnpm db:generate
pnpm verify:native
pnpm verify:client
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build
pnpm test:unit
pnpm test:integration
pnpm verify:commands
pnpm test:e2e
```

Use the D097 reference configuration, one-minute warm-up and ten-minute measurement. Record results by lookup group and separately for API and UI. Exercise authorized portrait management and rendering on the scale dataset. Run the PHASE 3 lookup load scenario and portrait recovery drill once their approved test assets are available. Use the existing Linux reference operations tooling for same-set restore. The existing authentication load entry point measures authentication. Register and report the PHASE 3 lookup scenario separately. Capture complete regression results and the exact executed revision.

## End-to-end walkthrough

1. Create a shared Player with the appropriate grant, handle duplicate review and upload a portrait. Verify a rejected replacement preserves the prior image and restricted access reveals no private data.
2. Receive BM1, return for supplementation and demonstrate the exact successor receipt and exception behavior. Approve the correct version with a different authorized actor.
3. Check and confirm a player registration with current rules. Repeat against ineligible, insufficient-basis and future conflict cases. Transfer a player and demonstrate that failure preserves the old registration. Exercise an authorized transfer out of a discontinued club and confirm only the destination undergoes a new validity decision.
4. Correct BM1 under D100 outside intake. Correct a validated registration under D057 across two effective regulation versions and verify FR-020 segment findings. Return another submitted correction for supplementation or reject it and confirm the existing official version remains current. Compare original and current official versions and the affected references.
5. Exercise due regulation and Closed/D099 races through real accepted PHASE 2 seams. Confirm integrated owner outcomes and rollback. Back up and restore portrait content and metadata to an isolated target, including an interrupted restore drill. Keep maintenance active until same-set verification, require fresh login after release and verify the restored current reference and access.
