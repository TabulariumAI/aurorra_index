# addressmap refactor plan

## Goal
Create `aurorra_index\src\features\addressmap` as a pure React feature, using `aurorra_index\src\features\legalplat` as the structural prototype and `aurorra-ui/Dialog` as the dialog shell.

## Current code reality
- The donor behavior to preserve lives in `document_web\src\domains\property\shell\mapviewer.js`.
- The donor dialog pattern is legacy and imperative.
- `aurorra_index\src\features\legalplat` already shows the intended package shape: separate content, dialog shell, styles, and tests.
- `aurorra_index\src\features\metdata\component\MetadataRows.tsx` already detects address-like rows and renders the address action.
- `aurorra_index\src\features\metdata\type\metadata.types.ts` currently exposes `onAddressClick` as an external callback, so address handling is not fully package-owned yet.

## Feature design
### Address map data
- Keep map URL shaping in `aurorra_index\src\features\addressmap\data`.
- Add `buildAddressMapEmbedUrl(address: string): string`.
- Add `appendAddressMapZoom(url: string, zoom: number): string`.
- Keep the default zoom value at `14` because that is the current donor behavior.
- Add the package-owned Google Maps embed URL builder for address row values.
- Do not add alternate map providers, fallback routing, legacy-support branches, aliases, or future-support paths.

### Address map hook/state
- Add package-owned address map state under `aurorra_index\src\features\addressmap`.
- The hook must own the selected map URL, zoom value, open state, open action, and close/reset action.
- The open action must accept the address string from the metadata row, build the Google Maps embed URL inside `aurorra_index`, and open `AddressMapDialog`.
- The close/reset action must close the dialog and clear the active map source.
- Do not route address opening through `document_web`, global events, `window`, `globalThis`, or app-owned callbacks.

### Address map content component
- `AddressMapContent` must be pure React and own the iframe render path only.
- The component must render the donor iframe contract inside its own content surface.
- Preserve the donor iframe behavior:
  - lazy loading
  - `referrerPolicy="no-referrer"`
  - fullscreen enabled
  - hidden until the render path is ready
  - reset on close
- Keep iframe lifecycle logic inside the content component and the `addressMap` data helper.
- Preserve donor timing with React state/effects only; do not use imperative DOM scheduling.
- Do not use `document.createElement`, `appendChild`, imperative DOM mutation, `innerHTML`, direct DOM queries, host element mutation, or controller classes in the React implementation.

### Address map dialog shell
- `AddressMapDialog` must own the shell wrapper and use `aurorra-ui/Dialog`.
- Use the dialog shell only for window chrome and open/close handling.
- Keep the shell behavior aligned with the donor:
  - `closeOnOverlay`
  - `showHeader`
  - `showCloseButton`
  - centered body mode
  - medium height mode
- Do not build a local dialog shell in `aurorra_index`.
- Do not import raw Radix dialog primitives directly in the feature.
- Do not recreate the legacy `MapViewer` class.

### Styles
- Keep styles in dedicated style modules under `aurorra_index\src\features\addressmap\style`.
- Separate content styling from dialog shell styling.
- Keep the content area sized to fill the dialog body.
- Do not move layout, shell, or iframe behavior into inline component logic.

### Package API
- Export the feature from `aurorra_index\src\index.tsx`.
- Keep the public API explicit and typed.
- Keep the package boundary React-first and free of legacy globals for this feature.
- Export only React components, hooks, data helpers, and types needed by package consumers.
- Do not export a `MapViewer` class or any imperative controller surface.

### Metadata integration
- Process address-view clicks inside `aurorra_index`.
- `MetadataRows` must call a package-owned address map open handler for address actions.
- `useMetadata` must own the address map state by using the package-owned `useAddressMap` hook.
- `MetadataPanel` must render `AddressMapDialog` from the `useMetadata` address map state.
- Remove `onAddressClick` from the required runtime path for the new address map behavior.
- Do not add or keep a document_web event bridge for address map opening in this feature.

### Test design
- Add direct tests for the URL helper and default zoom.
- Add content tests that prove the iframe contract and reset behavior.
- Add dialog tests that prove `aurorra-ui/Dialog` is used and the shell props match the donor behavior.
- Use `document_web\src\domains\property\shell\tests\mapviewer.unit.test.js` as the source contract for the new package tests.
- Port the current donor assertions into `aurorra_index\src\features\addressmap\test` so they verify the new React implementation instead of the legacy class.
- The new package tests must preserve these working-code assertions:
  - custom zoom appends `&z=17`
  - default zoom appends `&z=14`
  - iframe uses lazy loading
  - iframe uses `referrerPolicy="no-referrer"`
  - iframe allows fullscreen
  - iframe fills the content area
  - iframe is visible after render
  - iframe source is cleared on close/reset
  - dialog uses close-on-overlay behavior
  - dialog shows the header
  - dialog shows the close button
  - dialog uses medium height mode
- Add metadata integration tests that prove an address row opens `AddressMapDialog` without `callbacks.onAddressClick`.
- Add hook tests that prove open builds the embed URL and close clears the active source.
- Keep the tests package-local so they can be used unchanged against the new implementation.

### Browser visual design
- Add a package-owned Playwright visual harness following the existing `aurorra_ui` pattern.
- Use `aurorra_index\tests\visual` for the browser fixture and browser assertions.
- Add `aurorra_index\vite.visual.config.ts` and `aurorra_index\playwright.config.ts`.
- Update `aurorra_index\package.json` so `npm run test:visual` runs Playwright against the visual harness.
- The browser visual fixture must render an address row, open the package-owned map dialog, and close it.
- The browser assertion must verify the dialog is visible, the iframe exists, the iframe source includes the Google Maps embed URL and zoom parameter, and close/reset clears the iframe source.

### Prototype rule
- Keep `aurorra_index\src\features\legalplat` as the structural prototype only.
- Do not change `legalplat`.
- If a behavior is not already defined by the donor or the `legalplat` pattern, stop and report instead of inventing it.

## Proposed phases
### Phase 1: Add package tests from the donor contract
- Create the `aurorra_index\src\features\addressmap` feature tree.
- Use `legalplat` only as the file-structure prototype.
- Use `document_web\src\domains\property\shell\tests\mapviewer.unit.test.js` as the donor-contract assertion source.
- Add the package test files listed in the file-level targets in the same implementation pass as the production implementation.
- The tests must target the new `aurorra_index` React feature, not the legacy donor class.

### Phase 2: Build the package feature
- Add the pure map data helper, package-owned hook/state, content component, dialog wrapper, and style modules.
- Wire the dialog wrapper to `aurorra-ui/Dialog`.
- Wire metadata address actions to the package-owned address map open handler.
- Make the package-owned donor-contract tests pass against the React implementation.
- Add the Playwright visual harness and make the browser check pass.

### Phase 3: Export the feature
- Export the new address map feature from `aurorra_index\src\index.tsx`.
- Keep the public package surface typed and explicit.

### Phase 4: Verify the package
- Run the package checks for type safety, boundary safety, unit tests, visual tests, browser visual verification, and build.
- Fix any failures caused by the address map change.
- Report pre-existing unrelated failures separately.

## File-level targets
### Production
- `aurorra_index\src\features\addressmap\component\AddressMapContent.tsx`
- `aurorra_index\src\features\addressmap\component\AddressMapDialog.tsx`
- `aurorra_index\src\features\addressmap\hook\useAddressMap.ts`
- `aurorra_index\src\features\addressmap\style\addressMapStyles.ts`
- `aurorra_index\src\features\addressmap\style\addressMapDialogStyles.ts`
- `aurorra_index\src\features\addressmap\data\addressMap.ts`
- `aurorra_index\src\features\addressmap\type\addressMap.types.ts`
- `aurorra_index\src\features\addressmap\index.ts`
- `aurorra_index\src\features\metdata\component\MetadataPanel.tsx`
- `aurorra_index\src\features\metdata\component\MetadataRows.tsx`
- `aurorra_index\src\features\metdata\hook\useMetadata.ts`
- `aurorra_index\src\features\metdata\type\metadata.types.ts`
- `aurorra_index\src\index.tsx`
- `aurorra_index\package.json`
- `aurorra_index\playwright.config.ts`
- `aurorra_index\vite.visual.config.ts`

### Tests
- `aurorra_index\src\features\addressmap\test\AddressMapContent.vitest.test.tsx`
- `aurorra_index\src\features\addressmap\test\AddressMapDialog.vitest.test.tsx`
- `aurorra_index\src\features\addressmap\test\addressMap.vitest.test.ts`
- `aurorra_index\src\features\addressmap\test\useAddressMap.vitest.test.tsx`
- `aurorra_index\src\features\metdata\test\MetadataPanel.addressmap.vitest.test.tsx`
- `aurorra_index\tests\visual\index.html`
- `aurorra_index\tests\visual\addressmap.visual-entry.js`
- `aurorra_index\tests\visual\addressmap.visual.tsx`
- `aurorra_index\tests\visual\addressmap.visual.spec.ts`

## Acceptance criteria
- The feature lives fully inside `aurorra_index`.
- The map viewer is implemented as pure React.
- The shell uses `aurorra-ui/Dialog`.
- The feature has no legacy DOM controller ownership.
- The feature has no raw Radix dialog usage.
- The feature exports cleanly from `aurorra_index\src\index.tsx`.
- Address row clicks are processed inside `aurorra_index`.
- Address row clicks open the package-owned `AddressMapDialog` without `document_web` event handling.
- Close/reset clears the active iframe source.
- Tests are ported from the current donor-contract assertions in `document_web\src\domains\property\shell\tests\mapviewer.unit.test.js`.
- Tests cover the donor contract and the React shell split.
- Visual verification uses the package Playwright visual harness and checks the rendered map dialog in a browser.
- No TODOs, stubs, dead code, unfinished paths, pass-through wrappers, or speculative fallback behavior remain.

## Implementation rules
- Production-ready only.
- Full end-to-end package implementation inside `aurorra_index`.
- No partial changes, TODOs, stubs, dead code, or unfinished paths.
- No incremental patching that leaves old and new package paths partially wired.
- No scope drift, architecture changes, or unrelated fixes.
- Follow existing repo patterns, with `legalplat` as the structural prototype.
- Do not invent requirements or override this plan.
- Preserve unrelated user changes.
- If blocked, conflicting, or missing required information, stop and report before changing code.
- Fix failures caused by the address map change.
- Report pre-existing failures separately.

## Architecture and convention rules
- Do not change package architecture outside the listed file-level targets.
- Do not move ownership out of `aurorra_index`.
- Do not introduce new global event ownership, app-owned callbacks, or document_web event bridges.
- Do not add a new UI framework, dialog primitive, state library, routing layer, browser harness pattern, or build pattern unless it already exists in this workspace and is explicitly listed in this plan.
- Use the existing `legalplat` feature organization for package code.
- Use the existing `aurorra_ui` Playwright visual-harness pattern only for browser visual verification.
- Do not add compatibility layers, transitional adapters, duplicated runtimes, or shadow implementations.

## LLM-pattern prohibitions
- No ad-hoc patches.
- No incremental patching strategy.
- No over-engineered abstractions.
- No over-defensive checks.
- No over-simplified placeholder implementation.
- No redundant temporary variables.
- No pass-through helper wrappers.
- No redundant aliasing.
- No unnecessary indirection.
- No superfluous local variables or pointless local bindings.
- No speculative legacy support.
- No future-support stubs.
- No fallback values that are not required by the donor contract.
- No compatibility aliases.
- No duplicate names for the same concept.

## Verification
Run these from `aurorra_index`:

1. `npm run typecheck`
2. `npm run lint:boundary`
3. `npm run test:vitest`
4. `npm run test:visual`
5. `npm run build`

## Browser visual verification
- Run `npm run test:visual` from `aurorra_index`.
- Verify the dialog is visible.
- Verify the iframe is present.
- Verify the iframe `src` contains the expected Google Maps embed URL and zoom parameter.
- Verify close/reset removes or clears the iframe source.
- Capture or inspect the Playwright browser-rendered result before marking the task complete.

## Hard stop conditions
- Stop if a behavior is not defined by the donor or the `legalplat` prototype.
- Stop if any requirement would force legacy DOM ownership back into the feature.
- Stop if any unrelated package or app needs to change for the feature to stay pure React.
