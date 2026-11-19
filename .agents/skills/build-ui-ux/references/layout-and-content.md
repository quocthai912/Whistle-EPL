# Layout and content decisions

Apply these rules to the scoped feature. Extend the owning pattern; do not flatten
every surface into one font size, card width or button arrangement.

## Space and reading order

- Start with task order: choose scope/object, read facts, enter/review information,
  then take an action. Assign width according to content density, not equal boxes.
- Pair short related fields; allow names, reasons, date ranges and review evidence
  to span full rows. Use `minmax(0, 1fr)`/`min-width: 0` where grids could overflow.
- Use the analogue's spacing scale. Group heading, control and feedback explicitly;
  avoid stacked default paragraph margins and unexplained blank panels.
- Measure actual left/right content insets, including native scrollbar space. Title,
  form and footer must share the intended alignment. Inspect the full CSS cascade
  before adding overrides; changing a shared owner requires checking its callers.
- Align paired fields at the start. Reserve appropriate tracks for label/input/help
  when labels or errors wrap; an error on one field must not lift its neighbor.
- Give dense multi-section editors a complete readable canvas. Put navigation above
  the editor when a side column would compress it. Group optional details with
  disclosure while keeping required decision evidence available.
- Avoid duplicate titles such as repeating the active History tab as a heading.
  Show a state/fact once unless repetition has a clear decision-making purpose.

## Controls and actions

- Use the existing theme and CSS Modules, inherited Be Vietnam Pro, localized
  component wrappers and normal/hover/focus/disabled states. Retain the accepted
  dropdown and calendar interactions; native selects/date inputs are not replacements.
- Keep one primary action per decision group. Place secondary/cancel actions beside
  it and destructive actions in an appropriate separate context. Use the existing
  balanced profile-action grid for sibling commands instead of accidental wrapping.
- Table action headers and cells share alignment; center a direct button or its
  action container consistently. Keep row heights and logo boxes stable on load.
- Use localized styled file selection and original brand/media colors. Keep logos
  contained without stretching, tint overlays, filters or multiply blending.
- Distinguish editable, read-only, disabled and unavailable actions. Immutable master
  codes have a visibly disabled field and short explanation. Other domain codes
  follow their own specification; UUID identity does not make every business code immutable.
- Preserve permission-derived visibility/enabled conditions, including different
  actors viewing the same pending request. Presentation is not the security boundary.

## Dates, text and identity

- All date entry/selection uses DD/MM/YYYY; date-time display uses DD/MM/YYYY HH:mm
  with additional precision when the existing owner requires it. API/storage ISO
  values remain at the conversion boundary. Retain the contract's timezone semantics;
  do not globally reinterpret device-local and Asia/Ho_Chi_Minh business instants.
- Calendar input preserves invalid text for correction and does not erase validation
  on an unchanged blur. Dynamic rows retain edited values when adding/removing siblings.
- Use names and business codes: employee name/code, MUN, OTF, EPL-2030-2031, and
  readable version numbers. Keep UUIDs as internal identity; technical lookup may
  expose them in explicitly labeled advanced/collapsed sections with accurate help.
- Resolve missing/off-page names/version metadata through permitted data. Keep a
  clear loading/unavailable state instead of substituting UUIDs or guessing identity.
  Keep decisions blocked until their required identity/basis has resolved.
- New Phase audit events and changed fields need Vietnamese labels and readable
  before/after values in both global logs and object-specific histories.
- Keep user-facing copy about the task. Backend enum names, revision machinery,
  idempotency internals and implementation-scope commentary belong outside normal
  product copy unless needed to explain a recovery decision.
- Preserve business distinctions when simplifying text: custom goal/card names,
  classifications, correction reason/basis and saved-version evidence still matter.

## Modal, workflow and feedback behavior

- Long dialogs fit the viewport, scroll internally and keep commands accessible.
  Check the bottom of expanded previews and validation/conflict feedback, not just
  the opening screenshot. Use the shared feedback hook when applicable.
- Show saved/current facts separately from unsaved edits and approval evidence.
  Confirmation refers to the exact object/version reviewed; a refresh must not silently
  retarget the action. Present actual changes before permitting a conflict retry.
- Unknown outcomes are not successes. Preserve submitted input and request identity
  as required; lock edits that would alter that request and expose an appropriate
  result check/list reload. An error redesign must keep this recovery route intact.
- Explain no-access as an authenticated permission state with return navigation.
  Explain unassigned work without inventing menu items or repeating the same notice.
- Use linked labels, meaningful button/link text, visible keyboard focus, accessible
  errors and readable contrast. Color alone does not convey state. Preserve text
  alternatives and hide decorative icons from assistive technology.
