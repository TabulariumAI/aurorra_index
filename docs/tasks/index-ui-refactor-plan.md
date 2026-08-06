# aurorra_index UI Refactor Plan

## Goal
Remove nested scrollbars from the `aurorra_index` metadata UI, keep the host shell as the only scroll owner, and normalize the package surface to the explicit style and layout rules below without changing metadata behavior.

## Current code reality
- `IndexContainer` wraps the metadata surface in `metadataStyles.rootShell`, which currently introduces its own scroll container.
- `MetadataView` renders a separate internal panel with header, collapsible sections, and dense row cards.
- `metadataStyles` uses strong shadows, strong teal section chrome, and heavy bold text throughout the surface.
- The header currently renders the raw session string directly.
- The current visual test covers stability, but not the full host-vs-panel visual feel.

## Risk review
### 1. Scroll ownership conflict
- `aurorra_index` currently owns its own vertical scroll via `metadataStyles.rootShell` in `src/features/metdataview/style/metadataViewStyles.ts`.
- The host shell in `document_web` also owns layout and scrolling in `src/app/shell/style/AppShell.styles.ts`.
- Risk: changing only one side leaves the nested-scroll bug intact.
- Mitigation: treat scroll ownership as a cross-package behavior. The package shell must stop being a scroll container, and the host shell behavior must stay the single scrolling frame for the metadata surface.

### 2. Fixed-height container coupling
- `rootShell` currently locks the package to `calc(100vh - ...)` height and min-height.
- `IndexContainer` passes the metadata view straight into that wrapper without an intermediate layout layer.
- Risk: reducing shadows or typography without changing the height model will keep the same cramped, competing-scroll feel.
- Mitigation: make the package shell flow with the host and remove height locking from the package surface unless a specific inner sub-panel explicitly needs it.

### 3. Subjective visual target
- The plan currently says "clean", "lighter", "less aggressive teal", and "more readable session display".
- Risk: those phrases are not precise enough to implement consistently across title, session, counts, buttons, row values, and section headers.
- Mitigation: require targeted style decisions per surface area before implementation, and keep them bounded to existing components and style modules.

### 4. Regression surface is broader than the current tests
- Existing tests cover render and callback behavior, plus a single visual surface test.
- Risk: a visual-only refactor can preserve behavior tests while still reintroducing nested scrolling or layout overflow.
- Mitigation: add explicit layout assertions for shell containment and at least one visual/regression test for the combined host/package presentation.

### 5. Legacy callback and boundary contracts
- `MetadataView`, `useMetadata`, and `indexRuntime.ts` still depend on host-driven callbacks, store state, and worker behavior.
- Risk: a styling refactor can accidentally disturb the section/action structure or the open/selected state wiring if the layout is rewritten too broadly.
- Mitigation: keep the implementation scoped to shell/layout and style modules unless a test proves a structural change is required.

## Implementation contract
- `document_web/src/app/shell/style/AppShell.styles.ts` remains the host scroll owner for the metadata experience.
- `aurorra_index/src/features/metdataview/style/metadataViewStyles.ts` must not define a competing vertical scroll container for `rootShell`.
- `rootShell` must be a flow container only: no `overflow: auto`, no `height` lock, no `minHeight` lock, no box shadow, no border radius, and no internal scrollbar styling.
- The package surface must keep its current component tree: `IndexContainer` -> `MetadataProgress` -> `MetadataView`; no new wrapper layers.
- The session string remains raw text, but it must wrap cleanly and never overflow the header area.
- Open section chrome must be neutral, not teal-filled: use `panel` background with `line` border in both open and closed states, and keep teal only as a small accent in counts or text.
- `metadataStyles.title` must use `fontWeight: 700`.
- `metadataStyles.session` must use `fontWeight: 500` and overflow-safe wrapping.
- `sectionStyles.trigger` and `sectionStyles.count` must use `fontWeight: 700`.
- `rowStyles.value` must drop the current uppercase treatment and use `fontWeight: 700`.
- `metadataStyles.actionButton` and `rowStyles.actionButton` must use `fontWeight: 600`.
- Empty, loading, and error states must keep their current behavior and copy, but use the same spacing and border language as the rest of the surface.
- The legal view modal remains present and unchanged in behavior.

## Radix composition contract
- `@radix-ui/react-collapsible` is the section primitive. Every metadata section must render as `Collapsible.Root`, `Collapsible.Trigger`, and `Collapsible.Content`; open state must remain controlled by `openSegment` and `setSectionOpen`.
- `Collapsible.Trigger` must carry the complete interactive header, including title, count, and visual open-state indicator. Do not split the click target across multiple custom controls.
- `Collapsible.Content` must contain only the section action line and row/content body. Do not move data fetching, filtering, or selection logic into the primitive layer.
- `@radix-ui/react-dialog` is the legal viewer primitive. The legal modal must keep `Dialog.Root`, `Dialog.Portal`, `Dialog.Overlay`, `Dialog.Content`, `Dialog.Title`, and `Dialog.Close`.
- `Dialog.Content` must be the highest elevation surface in the package UI. It may use local scroll because it is a bounded modal sub-panel, not the page shell.
- `@radix-ui/react-tooltip` is the action affordance primitive. Every icon-only row action must render `Tooltip.Root`, `Tooltip.Trigger asChild`, `Tooltip.Portal`, and `Tooltip.Content`.
- Tooltip labels must match the current action meanings: confirm ambiguity, open page image, pop index, edit index, and open address.
- `@radix-ui/react-progress` is the loading primitive. Metadata loading must keep an accessible progress indicator and must not add a second scroll surface.
- Keep the UI composed from these primitives rather than rebuilding disclosure, overlay, tooltip, or progress behavior with custom DOM patterns.
- Do not introduce custom overlay, tooltip, accordion, modal, or progress behavior if a Radix primitive already covers the interaction.
- Keep any added Radix dependency explicit in `aurorra_index/package.json` and covered by tests in the same change.

## Materialized design specification
### Visual system tokens
- `surfaceCanvas`: `transparent`, used by `rootShell` so the host shell remains visible.
- `surfacePanel`: `#ffffff`, used for metadata rows, section bodies, modal content, and empty/error panels.
- `surfaceRaised`: `#f8fafc`, used for section headers and low-emphasis nested surfaces.
- `surfaceAccent`: `rgba(6, 175, 193, 0.10)`, used only for selected state and small accents.
- `borderSubtle`: `#d9e1ea`, used for row and section borders.
- `borderAccent`: `#06afc1`, used only for narrow left accents, count text, focus rings, or selected state.
- `textStrong`: `#20252d`, used for title, row value, and section title.
- `textMuted`: `#687386`, used for session, explanations, quotes, and empty states.
- `shadowLevel1`: `0 0.18rem 0.55rem rgba(15, 23, 42, 0.08)`, used for rows and sections only where elevation is needed.
- `shadowLevel2`: `0 0.55rem 1.35rem rgba(15, 23, 42, 0.14)`, used for the legal dialog content.

### Shell surface
- `rootShell` must use `background: transparent`, `overflow: visible`, `height: auto`, `minHeight: 0`, `width: 100%`, `minWidth: 0`, `maxWidth: none`, `boxShadow: none`, `border: 0`, and `borderRadius: 0`.
- `rootShell` padding must be compact and host-aware: keep horizontal padding no larger than `0.9rem` and vertical padding no larger than `0.8rem`.
- `root` must be the package content grid and must not create scroll. It should define the vertical rhythm between header and sections.

### Header surface
- Header must be a quiet material header, not a large title block.
- Header uses a white or raised surface, `border: 1px solid borderSubtle`, `borderLeft: 0.2rem solid borderAccent`, and `boxShadow: shadowLevel1`.
- Title text must render the document class with `fontSize` between `1.15rem` and `1.3rem`, `fontWeight: 700`, and `letterSpacing: 0`.
- Session text remains the raw session string, but must use `overflowWrap: anywhere`, `wordBreak: break-word`, `maxWidth: 100%`, and no forced uppercase.

### Section surface
- Section root must read as a material surface: white or raised background, `border: 1px solid borderSubtle`, `borderRadius` no larger than `0.45rem`, and controlled elevation no stronger than `shadowLevel1`.
- Open and closed section headers must share the same neutral material structure. Open state must not use a filled teal background.
- Open state may use one or more of: teal count text, narrow left border/accent, subtle raised background, or focus ring.
- Section trigger must be a full-width Radix trigger with stable height between `2.35rem` and `2.7rem`, `fontWeight: 700`, `letterSpacing: 0`, and no underline.
- Count badge must be compact, non-dominant, and stable: minimum width `1.45rem`, height `1.45rem`, rounded pill, neutral background, and teal text only when open.
- Section content gap must be consistent and must not collapse row borders together.

### Row surface
- Rows must read as individual material records, not heavy cards.
- Row background is `surfacePanel`; border is `1px solid borderSubtle`; left accent is retained for status but reduced to a narrow controlled accent.
- Selected rows use `surfaceAccent` and an inset/focus style, not a large shadow.
- Row values must keep original casing, drop `textTransform: uppercase`, use `fontWeight: 700`, and wrap safely.
- Explanation and quote lines use `textMuted`, smaller type than the row value, and clear line spacing for scanning.
- Row action controls remain icon-only buttons with Radix tooltips. Buttons must have stable square dimensions and visible hover/focus states.

### Action controls
- Section text actions such as `Reprocess` and `|| Refine or Chat` must become quiet material text buttons using `fontWeight: 600`, restrained teal text, no heavy bold treatment, and focus-visible outline.
- Row icon actions must use existing icon structure unless an approved icon dependency is added; they must not become large text buttons.
- Action hover states must be visible but not layout-shifting: use background, color, or outline changes only.

### Modal surface
- Legal dialog overlay must keep a dark translucent backdrop.
- Legal dialog content must be the strongest material surface in the package, using `shadowLevel2`, a border, and a radius no larger than `0.5rem`.
- Legal dialog may scroll internally with `maxHeight: 86vh` and `overflow: auto`; this is the only approved local scroll area in this task.
- Legal dialog close control must remain accessible and visibly aligned with the dialog header.

### Empty, loading, and error states
- Empty state uses the same material row spacing and muted text treatment as normal row content.
- Error state uses the same panel surface with red text and no new behavior.
- Loading overlay must remain positioned over the package surface and must not create a scroll container.
- Progress must remain accessible through the Radix progress primitive.

## Files to update
### Production
- `aurorra_index/src/features/metdataview/style/metadataViewStyles.ts`
- `aurorra_index/src/features/metdataview/component/MetadataView.tsx`
- `aurorra_index/src/features/metdataview/component/MetadataSection.tsx`
- `aurorra_index/src/features/metdataview/component/MetadataRows.tsx`

### Tests
- `aurorra_index/src/features/indexing/test/IndexContainer.vitest.test.tsx`
- `aurorra_index/src/features/metdataview/test/metadata-visual.vitest.test.tsx`
- `document_web/src/app/shell/test/AppShell.vitest.test.tsx`

### Not expected to change
- `document_web/src/app/shell/style/AppShell.styles.ts`
- `document_web/src/features/index/legacy/indexRuntime.ts`
- `document_web/src/features/index/legacy/indexBridge.ts`
- `aurorra_index/src/features/indexing/component/IndexContainer.tsx`

## Implementation rules
- Do not change code before explicit implementation approval.
- Keep the host shell as the only vertical scroll owner.
- Remove the package-level scroll container from `aurorra_index` unless a specific inner sub-panel explicitly needs its own local scroll.
- Keep the package surface flow-based instead of height-locked to `100vh` or `calc(100vh - ...)`.
- Remove duplicate elevation and avoid stacking shadows in both the host and the package surface.
- Keep typography consistent and lighter where the current UI is visually overbold.
- Preserve the existing feature behavior, section visibility, actions, and data flow.
- Do not add fallback UI paths or alternate layouts unless explicitly required by this plan.
- Use existing repo patterns and keep changes deterministic and testable.
- Any style or structure change must be verified by updated visual and component tests.

## Scope
### Fix in `aurorra_index`
- Shell layout and scroll ownership on the package side.
- Section header weight, spacing, and hierarchy.
- Card shadows, borders, and section chrome.
- Session/header presentation.
- Row density, action button weight, and spacing.
- Empty/error/loading presentation consistency.

### Keep unchanged unless a test proves otherwise
- Metadata data fetching.
- Section visibility logic.
- Worker/client behavior.
- Callback contracts.
- Existing payload and store contracts.

## UI target
- One scroll container at the host level.
- Flat, low-elevation surface inside `aurorra_index`.
- `metadataStyles.title`: `fontWeight: 700`.
- `metadataStyles.session`: `fontWeight: 500` with overflow-safe wrapping.
- `sectionStyles.trigger` and `sectionStyles.count`: `fontWeight: 700`.
- `rowStyles.value`: no uppercase treatment, `fontWeight: 700`.
- `metadataStyles.actionButton` and `rowStyles.actionButton`: `fontWeight: 600`.
- Section chrome uses a neutral background and border, with teal only as an accent.
- Header, sections, rows, and dialog must follow the Materialized design specification exactly.
- Spacing must use the same compact material rhythm across header, section chrome, cards, and modal content.
- Icon buttons must be stable square controls with Radix tooltip labels and visible hover/focus states.

## Proposed phases
### Phase 1: Visual cleanup and scroll ownership
- Remove the internal scroll behavior in the package shell.
- Remove the package container height lock so the host can own the viewport scroll.
- Set `rootShell` to flow layout only with `overflow: visible`, `height: auto`, `minHeight: 0`, `width: 100%`, and `minWidth: 0`.
- Align the package shell with the host container without adding a second scroll frame.
- Apply the `rootShell`, `root`, and loading overlay rules from the Materialized design specification.
- Normalize spacing between the header, sections, and row cards.
- Update tests for shell containment, scroll ownership, and critical container layout behavior in both `aurorra_index` and `document_web`.

### Phase 2: Typography and section chrome
- Reduce boldness in titles, section headers, row values, and action buttons where the current UI is too heavy.
- Use neutral section headers with teal only as an accent; do not keep the current filled teal open-state header.
- Simplify badge/count treatment and action button styling using the existing button and tooltip patterns.
- Keep the session line raw but allow wrapping and overflow-safe breaking.
- Apply the header, section, action-control, and token rules from the Materialized design specification.
- Update tests for visible labels, section controls, and header wrapping.

### Phase 3: Row and detail polish
- Tighten row card spacing, borders, and metadata text density.
- Make explanation and quote lines easier to scan.
- Rebalance action icons and row affordances so they read as secondary controls.
- Keep the legal modal behavior unchanged while aligning its visual treatment with the package surface.
- Apply the row, modal, empty, loading, and error-state rules from the Materialized design specification.
- Update component and visual tests for representative metadata states.

## Acceptance criteria
- The package no longer creates a competing scrollbar when embedded in the host.
- The package shell no longer uses a fixed-height scroll container.
- The UI matches the explicit typography and chrome rules in the implementation contract.
- Shadows, borders, teal accents, row states, modal surface, tooltips, and progress follow the Materialized design specification.
- Session text is readable and does not create layout overflow.
- Tests cover the updated layout, host/package scroll ownership, and at least one representative visual surface.
- The plan leaves no unresolved ownership, layering, or styling decisions for the implementation pass.

## Verification
- `npm run test:vitest`
- `npm run test:visual`
- `npm run typecheck`
- `npm run build`
- `npm run lint:boundary`
