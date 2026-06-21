# Metadata JSON Split Plan

## Objective

Store fetched metadata JSON by explicit package-owned parts while keeping the current metadata behavior unchanged for rendering, callbacks, worker output, and package consumers.

This task is limited to metadata JSON storage and retrieval. It must not change metadata fetching, metadata rendering, callback contracts, legal rendering behavior, row actions, segment visibility, refresh behavior, or host adapter behavior.

## Current Code Contract

- `aurorra_index/src/features/metdata/store/indexStore.ts` currently stores full metadata payloads in `dataBySession`.
- `aurorra_index/src/features/metdata/hook/useMetadata.ts` currently retrieves metadata with `store.dataBySession[session]`.
- `aurorra_index/src/features/metdata/data/metadataData.ts` currently derives panel data from a full `MetadataPayload`.
- `aurorra_index/src/features/metdata/type/metadata.types.ts` currently types the store as `Record<string, MetadataPayload>`.
- `aurorra_index/src/index.tsx` exports metadata data helpers, the metadata store API, and metadata types.

## Required JSON Parts

Persist metadata under these exact part names:

- `headingJSON`: `heading`, `tags`, `usage`
- `secretsJSON`: `secrets`
- `indexJSON`: `indexes`, `parties`
- `legalJSON`: `legals`
- `pagesJSON`: `pages`
- `chainJSON`: `chain`, `history`
- `financialJSON`: `fee_factors`, `fees`, `funds`

Every key listed above must be represented in the typed split structure. Missing optional source fields must remain absent in the recomposed payload.

## File Scope

Production changes are limited to these files:

- `aurorra_index/src/features/metdata/type/metadata.types.ts`
- `aurorra_index/src/features/metdata/data/metadataData.ts`
- `aurorra_index/src/features/metdata/store/indexStore.ts`
- `aurorra_index/src/features/metdata/hook/useMetadata.ts`
- `aurorra_index/src/index.tsx`

Test changes are limited to these files:

- `aurorra_index/src/features/indexing/test/indexStore.vitest.test.ts`
- `aurorra_index/src/features/indexing/test/metadataData.vitest.test.ts`
- Existing render or visual tests only if a compile failure proves they reference the old store shape directly.
- `aurorra_index/src/test/metadata#v1.json` as the canonical metadata fixture for split/recompose coverage.

No other production file is in scope.

## Implementation Plan

### 1. Add Split Metadata Types

Update `metadata.types.ts` with explicit types for each stored JSON part:

- `MetadataHeadingJSON`
- `MetadataSecretsJSON`
- `MetadataIndexJSON`
- `MetadataLegalJSON`
- `MetadataPagesJSON`
- `MetadataChainJSON`
- `MetadataFinancialJSON`
- `MetadataJSONParts`

Update `IndexStoreState` so the store owns split metadata by session:

- Replace `dataBySession: Record<string, MetadataPayload>` with `metadataJSONBySession: Record<string, MetadataJSONParts>`.
- Keep `setData(session: string, data: MetadataPayload): void` as the public write API.
- Add `getData(session: string): MetadataPayload | null` as the public read API.
- Keep `activeSession`, `error`, `status`, `setError`, `setLoading`, `resetMetadata`, and `invalidateSession`.

Do not change `MetadataPayload`, worker result types, callback payload types, or public component props.

### 2. Add Split and Compose Helpers

Update `metadataData.ts` with pure helpers:

- `splitMetadataJSON(data: MetadataPayload): MetadataJSONParts`
- `composeMetadataJSON(parts: MetadataJSONParts | null | undefined): MetadataPayload | null`

`splitMetadataJSON` must copy fields into the required part names exactly:

- `headingJSON` receives `heading`, `tags`, and `usage`.
- `secretsJSON` receives `secrets`.
- `indexJSON` receives `indexes` and `parties`.
- `legalJSON` receives `legals`.
- `pagesJSON` receives `pages`.
- `chainJSON` receives `chain` and `history`.
- `financialJSON` receives `fee_factors`, `fees`, and `funds`.

`composeMetadataJSON` must reconstruct the current `MetadataPayload` shape used by existing rendering code. It must not add default arrays, default objects, placeholder values, or fallback values that were not present in the stored parts.

Keep existing helpers unchanged in behavior:

- `asIndexArray`
- `isValidIndex`
- `getIndexedValue`
- `getParcelOptions`
- `getSegmentItems`
- `isAmbiguous`
- `getPanelData`

### 3. Update Zustand Store Persistence

Update `indexStore.ts` so storage writes split parts and retrieval returns a recomposed payload:

- Import `splitMetadataJSON` and `composeMetadataJSON`.
- `setData(session, data)` stores `splitMetadataJSON(data)` under `metadataJSONBySession[session]`.
- `getData(session)` returns `composeMetadataJSON(metadataJSONBySession[session])`.
- `invalidateSession(session)` removes only that session from `metadataJSONBySession`.
- `resetMetadata()` clears `metadataJSONBySession`.
- Loading, success, idle, and error state behavior remains unchanged.

Do not move this state into `aurorra_index/src/store/state/store.ts`. That store is the package-global shell store and currently only owns `resetAllState`; metadata storage belongs in the existing metadata feature Zustand store.

### 4. Update Metadata Retrieval

Update `useMetadata.ts` so the hook reads metadata through the store API:

- Replace direct `store.dataBySession[session] || null` access with `store.getData(session)`.
- Keep `loadMetadata` writing through `indexStoreApi.getState().setData(session, data)`.
- Keep callbacks receiving the original worker `MetadataPayload` returned by `client.indexData`.
- Keep `panelData` derived from the recomposed `MetadataPayload`.

The UI must continue to receive the same metadata shape it receives today.

### 5. Preserve Package Exports

Update `src/index.tsx` to export the new split helpers and split metadata types:

- `splitMetadataJSON`
- `composeMetadataJSON`
- `MetadataHeadingJSON`
- `MetadataSecretsJSON`
- `MetadataIndexJSON`
- `MetadataLegalJSON`
- `MetadataPagesJSON`
- `MetadataChainJSON`
- `MetadataFinancialJSON`
- `MetadataJSONParts`

Existing exports must remain available.

### 6. Update Tests

Update `indexStore.vitest.test.ts` to prove:

- `setData` stores metadata in split parts.
- `getData` returns a recomposed `MetadataPayload`.
- `invalidateSession` removes split parts for the session.
- `resetMetadata` clears split metadata storage.
- Store status behavior remains unchanged.

Update `metadataData.vitest.test.ts` to prove:

- `splitMetadataJSON` maps every required field into the correct JSON part.
- `composeMetadataJSON` reconstructs the original payload shape from split parts.
- Missing optional fields remain absent after recomposition.
- The fixture `aurorra_index/src/test/metadata#v1.json` round-trips through split and compose without altering stored metadata semantics.
- Existing `getPanelData`, `getSegmentItems`, `getParcelOptions`, and `isAmbiguous` tests still pass.

No visual snapshot change is expected from this task. If a visual test changes, the implementation is outside scope unless the diff is caused by a required compile or type update.

## Acceptance Criteria

- Metadata fetched from the worker is stored by JSON parts, not as a single full payload object.
- Metadata rendering still receives a full `MetadataPayload` shape through recomposed retrieval.
- Existing callbacks still receive `MetadataPayload`.
- Existing worker client and worker response behavior are unchanged.
- Existing metadata UI behavior is unchanged.
- No default metadata values are introduced during split or compose.
- No host adapter, legacy runtime, or document web code is changed.
- No unrelated store ownership is introduced.
- Public exports remain backward compatible and include the new split helpers and types.

## Validation

Run these commands from `aurorra_index`:

1. `npm run typecheck`
2. `npm run lint:boundary`
3. `npm run test:vitest`
4. `npm run test:visual`
5. `npm run build`

The task is complete only when all five commands pass.
