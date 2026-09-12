# Metadata Index Migration Plan

## Goal
Move the metadata feature out of `document_pwa` into `aurorra_index` as a pure React package, while keeping `document_pwa` as the user-facing app through a thin adapter layer.

## Current code reality
- `document_pwa/src/features/index/legacy/metadata/api/documentWorker.js` still calls `/v1/document/{session}/data`.
- The required route is `/v1/index/{session}/data`.
- `document_pwa/src/features/index/legacy/metadata/svc/metadata_service.js` owns fetch, app-store persistence, DOM rendering, event emission, reprocess actions, focus state, and progress handling.
- `document_pwa/src/features/index/legacy/metadata/shell/*` is DOM-based and not React.
- `document_pwa/src/bootstrap/app-imports.ts` imports metadata helpers, metadata DOM renderers, metadata services, legal viewer, and progress globals directly.
- `aurorra_index` currently contains only a minimal React shell, Zustand store, and a boundary checker forbidding legacy/global dependencies.
- `aurorra_intake/src/features/provision/worker/*` provides the package-owned worker-client pattern that `aurorra_index` metadata fetching must follow.

## Implementation Rules
- Before implementation, restate the exact solution in three bullets and wait for `YES`.
- Do not change code before explicit implementation approval.
- Reuse or copy code from the current projects first: `document_pwa`, `aurorra_index`, `aurorra_intake`, and `aurora_core`.
- Use external sources only when the required pattern cannot be found in the current projects.
- Implement only the explicitly described solution.
- If any design, flow, orchestration, ownership, layering, UI, behavior, or architecture detail is missing, stop and ask a practical blocking question tied to exact files/functions.
- Do not introduce fallback/default values unless explicitly requested.
- Do not use speculative legacy support, aliases, future-support paths, or unrequested stubs.
- Do not make likely or alternative fixes.
- Every implementation change must be deterministic and validated by tests added or updated in the same change set.
- Do not introduce or preserve trailing whitespace.
- Use shortest unambiguous names, normally two or three tokens.
- Produce production-ready deterministic code only.
- No TODOs, dead code, partial paths, pass-through wrappers, single-use wrappers, trivial helpers, ad hoc hacks, shortcut implementations, or over-defensive checks.
- No partial work: each phase must be complete across affected files and verified with tests and grep gates before moving on.
- Provide only the final solution for implementation work: updated code and updated/added tests.

## Scope
### Move into `aurorra_index`
- Metadata data normalization helpers.
- Legal data normalization helpers.
- Metadata feature state and React rendering.
- Package-owned worker-facing index data client for `GET /v1/index/{session}/data`.
- Metadata views rewritten as React components.
- Package-owned refresh/re-download state and cache invalidation.
- Typed test doubles for the explicitly deferred `pageMap`, `segment`, and `selectedIndex` interactions.

### Keep in `document_pwa`
- Existing bootstrap wiring remains only until phase 3 cutover replaces it with the adapter.
- EventBus / UI / global store integration only in `src/features/index` after adapter cutover.
- App-provided inputs: `session`, `choices`, auth token/config, approved segment mapping, approved feature flags, and `numOfPages` integration.

## Public Package API
`aurorra_index` must expose a React-first API from its package entrypoint. The package API must be explicit and typed before adapter wiring.

Required exports:
- `IndexMetadata`: React component that renders the metadata feature.
- `createIndexWorkerClient`: worker client factory matching the `aurorra_intake` provision worker pattern.
- `useIndexStore` / `indexStoreApi`: Zustand state API for package-owned metadata data and refresh state.
- Metadata normalization helpers required by tests and package internals.
- Type exports for metadata payloads, worker commands/results, component props, callback contracts, and store state.

Required component inputs:
- `session`.
- `choices`.
- `apiBaseUrl`.
- `token`.
- `segments`.
- Approved feature flags.
- Approved `numOfPages` adapter integration.
- Approved callback contract from the callback boundary section.

The package must not expose or require `document_pwa` globals.

## Worker Ownership
- Fetching `/v1/index/{session}/data` is owned by `aurorra_index`.
- Follow the `aurorra_intake/src/features/provision/worker` pattern:
  - `src/features/indexing/worker/indexWorkerClient.ts` creates a module worker.
  - `src/features/indexing/worker/IndexWorker.ts` validates command input, builds URLs, sends auth headers, parses responses, and returns typed `{ ok, data | error }` results.
- Worker commands must include explicit `apiBaseUrl`, `token`, and `session` inputs.
- Missing token, missing API base URL, invalid session, network failure, non-JSON payloads, upstream HTTP errors, and validation errors must be tested.
- The worker output shape must match the React metadata feature contract.

## Data Ownership
- The metadata feature must store metadata data locally inside `aurorra_index`.
- `aurorra_index` owns metadata data and refresh/re-download state in this plan.
- `pageMap`, `segment`, and `selectedIndex` must not be moved in this plan.
- `pageMap`, `segment`, and `selectedIndex` must be represented only by typed test doubles for explicitly deferred package interactions.
- `document_pwa` must not receive new metadata state ownership in this plan.
- `numOfPages` integration must be passed through the adapter exactly where the current app flow uses it.
- Local storage, cache invalidation, and refresh behavior must stay inside the package boundary.

## Callback Boundary
Metadata interactions that will later be handled by other `aurorra_index` features must remain inside the package boundary.

For this migration task:
- Implement typed callback seams inside `aurorra_index`.
- Use test doubles only for interactions whose real feature implementation is explicitly deferred.
- Do not route deferred interactions through `document_pwa` event ownership.
- Do not make final orchestration decisions for deferred features in this task.

Callbacks/events to model with typed package callbacks and test doubles for now:
- Page click.
- Address click.
- Legal view.
- Refresh / re-download.
- Drop index.
- Confirm index.
- Edit/refine page.
- Segment expand.
- Index focus.
- Reprocess complete notification.

## No Compromise Rule
- The transfer must be complete within the selected migration phase with zero architectural compromises.
- Do not prefer a mechanical transform path over the required pure React architecture.
- The target architecture must be fully pure React, with Zustand for package state and Radix UI for UI composition.
- Any migration step must preserve the zero-legacy boundary and cannot reintroduce partial legacy ownership.
- The only allowed test doubles are the explicitly listed typed seams for deferred `aurorra_index` features.

## Pure React Boundary
- Pure React means zero legacy ownership inside `aurorra_index` for metadata behavior.
- Do not copy legacy globals, DOM controllers, or `document_pwa` state management into the package.
- Do not let the package read from or write to `document_pwa` global store directly.
- If the feature needs data from `document_pwa`, the adapter must provide it explicitly as typed inputs.
- The package may only own metadata data and metadata refresh state in this plan.
- The existing `aurorra_index/scripts/check-boundary.cjs` boundary check must continue to pass.

## Required Inputs From `document_pwa`
- `session` for all metadata fetch and refresh requests.
- `choices` for section visibility and metadata feature mode decisions.
- Approved segment value mapping / segment constants used by the metadata UI.
- Worker API config and auth context for fetching `/v1/index/{session}/data`.
- Approved store-derived feature flags that the metadata UI must respect.
- Approved progress bar host/wrapper integration when the package renders loading state.
- Approved `numOfPages` integration.

## Forbidden In The Package
- Loading or persisting `choices` by itself.
- Loading session or auth state from `document_pwa` globals.
- Reading `ENV`, `API`, `WorkerHelper`, `EventBus`, `UI`, `AlertHelper`, `ALERT_MESSAGES`, or `globalThis.store` directly.
- Keeping duplicate metadata state outside the package-owned local store/cache.
- Depending on legacy DOM renderers for core metadata rendering.
- Depending on `document_pwa` paths or bootstrap order.
- Adding fallback/default values that were not explicitly requested.
- Adding aliases or compatibility paths that were not explicitly requested.

## UI Support
- Use Radix UI primitives as the default UI foundation for metadata feature composition wherever possible.
- Add required Radix dependencies to `aurorra_index` explicitly.
- Add `aurora-core` to `aurorra_index` and use it for the progress bar implementation.
- Keep custom styling thin and composable on top of Radix UI and existing package conventions.
- Prefer package-owned UI wrappers over direct legacy DOM widgets.
- No legacy DOM widgets may be used for core metadata rendering.

## Strict Architecture Validation
- `aurorra_index` must enforce zero-compromise pure React architecture with automated checks.
- Boundary validation must fail on legacy/global dependencies, including `globalThis`, `UI`, `EventBus`, `EVENTS`, `ENV`, `API`, `WorkerHelper`, `AlertHelper`, `ALERT_MESSAGES`, direct `document_pwa` paths, DOM controller imports, and bootstrap-order coupling.
- Tests must verify that package modules do not import or reference forbidden legacy symbols.
- Zustand is the only package state foundation for metadata data and refresh state in this plan.
- Radix UI is the default UI composition foundation wherever primitives apply.
- No implementation may bypass React rendering with imperative DOM mutation for core metadata UI.
- Grep gates must verify forbidden imports/symbols and trailing whitespace before completion.

## Required Backend Contract
### Worker Route
- `GET /v1/index/{session}/data`
- Auth header: `Authorization: Bearer <token>`
- Response is the index data payload used by the metadata feature.

## Implementation Phases
### Phase 1: Package foundation, worker, and normalized data
- Add metadata feature structure under `aurorra_index/src/features/indexing`.
- Add shared metadata/index payload types.
- Move and convert pure metadata normalization helpers into TypeScript package modules.
- Move and convert legal data normalization helpers into TypeScript package modules.
- Add package-owned worker client and worker using the `aurorra_intake` provision worker pattern.
- Fetch metadata from `/v1/index/{session}/data`.
- Add Zustand state for metadata data and refresh status only.
- Add typed test doubles for `pageMap`, `segment`, and `selectedIndex`; do not migrate their ownership in this plan.
- Add tests for normalization, worker route building, worker success/failure handling, metadata data/refresh state, and typed deferred-state test doubles.
- Run typecheck, boundary check, unit tests, package build, and grep gates.

### Phase 2: Pure React metadata rendering with typed deferred interactions
- Build React metadata components for sections currently covered by `segmentrenderer.js`, `metadataviewer.js`, and legal rendering.
- Use Radix primitives where applicable for collapsible/disclosure, dialogs, tooltips, and actions.
- Use `aurora-core` progress bar for loading/refresh state.
- Implement typed callback seams with test doubles for deferred package-internal features.
- Implement section visibility from `choices` passed by the adapter.
- Implement typed test-double behavior for segment expand and index focus.
- Do not finalize ownership or orchestration for deferred features in this plan.
- Add component tests for all metadata sections, legal rendering, row actions, empty states, focus/highlight behavior, and callback contracts.
- Add visual tests for the metadata feature in package/demo context.
- Run typecheck, boundary check, unit/component tests, visual tests, package build, and grep gates.

### Phase 3: `document_pwa` adapter cutover and cleanup
- Add `document_pwa/src/features/index` as the only bridge into `aurorra_index`.
- Pass explicit inputs from `document_pwa` into the package component/API.
- Keep app events and user-facing session flow stable through the adapter only.
- Route metadata rendering through `aurorra_index`.
- Remove direct dependency on the legacy document-worker metadata path for metadata data.
- Update `src/bootstrap/app-imports.ts` so only the adapter remains for metadata feature wiring.
- Retire legacy metadata DOM code only after adapter tests and visual checks prove the new path.
- Rewrite stale metadata tests around the package boundary and adapter behavior.
- Keep integration tests that protect event/session compatibility.
- Run full `document_pwa` tests, typecheck, build, authenticated visual checks, and grep gates.

## File-Level Targets
### `aurorra_index`
- `src/features/indexing/component/*` for React UI.
- `src/features/indexing/store/*` or existing `src/store/*` extension for metadata data and refresh state.
- `src/features/indexing/worker/*` for the index worker and worker client.
- `src/features/indexing/data/*` for normalization helpers.
- `src/features/indexing/type/*` for package contracts.
- Tests for metadata normalization, worker route handling, metadata data/refresh state, React rendering, callbacks, visual checks, and boundary validation.
- Package dependency updates for Radix UI and `aurora-core`.

### `document_pwa`
- `src/features/index/*` adapter layer.
- `src/bootstrap/app-imports.ts` after the new adapter is ready.
- Legacy metadata files only until the phase 3 cutover removes their feature-path usage.
- Tests rewritten or added for adapter boundary and app flow compatibility.

## Acceptance Criteria
- Metadata data is fetched by `aurorra_index` from `/v1/index/{session}/data`.
- Metadata rendering is implemented in React inside `aurorra_index`.
- `document_pwa` only acts as the adapter boundary.
- `pageMap`, `segment`, and `selectedIndex` are not migrated in this plan; they are represented by typed test doubles only.
- Deferred metadata interactions are represented by typed package callbacks and test doubles in this task, not by `document_pwa` event ownership.
- Legacy metadata DOM code is no longer required for the migrated feature path after phase 3.
- Tests cover the new worker route, metadata normalization flow, package metadata data/refresh state, React rendering, adapter boundary, and visual behavior.
- Boundary checks prevent legacy/global dependencies in `aurorra_index`.
- Grep gates prove no forbidden symbols, no forbidden imports, and no trailing whitespace in touched files.

## Required Verification Per Phase
- `aurorra_index`: typecheck, boundary check, package unit/component tests, package build, grep gates.
- `aurorra_index`: visual checks for every React metadata phase.
- `document_pwa`: adapter unit/integration tests after phase 3.
- `document_pwa`: full test suite, typecheck, build, authenticated visual regression checks, grep gates after phase 3.

## Risks To Verify
- Adapter must preserve existing user-facing session flow without taking new metadata ownership.
- Existing metadata tests must catch legacy/global leakage, missed visual behavior, and unsupported assumptions before cutover.
- Visual parity must be verified because DOM renderers are being replaced by React components; visual tests are mandatory and cannot be skipped.
- Any unknown, assumption, or unclear ownership found during implementation must stop the phase until clarified.
