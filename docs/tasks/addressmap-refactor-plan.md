# addressmap refactor plan

## Readiness
Ready for implementation after this plan and `document_web/docs/task/addressmap-legalmap-dialog-plan.md` are implemented together.

## Goal
Remove dialog and display ownership from `aurorra_index/src/features/addressmap`. The package must expose the address map content and URL helpers only. `document_web` owns open state, dialog chrome, close behavior, and placement.

## Current code reality
- `aurorra_index/src/features/addressmap/component/AddressMapDialog.tsx` wraps `AddressMapContent` in `aurora-core/Dialog`.
- `aurorra_index/src/features/addressmap/hook/useAddressMap.ts` owns dialog open/source/zoom state.
- `aurorra_index/src/features/metdataview/hook/useMetadata.ts` imports `useAddressMap` and passes address dialog state to `MetadataPanel`.
- `aurora_core/src/features/metadata/component/MetadataPanel.tsx` imports and renders `AddressMapDialog`.
- `aurorra_index/src/features/metdataview/component/MetadataRows.tsx` opens the package-owned map state through `onAddressMapOpen`.
- `MetadataCallbacks.onAddressClick` already exists and `document_web/src/features/metadata/legacy/metadataRuntime.ts` already emits `EVENTS.showIndexAddress`.

## Required package contract
- `AddressMapContent` remains the only React address map component exported by the package.
- `buildAddressMapEmbedUrl`, `appendAddressMapZoom`, and `DEFAULT_ADDRESS_MAP_ZOOM` remain package data exports.
- `aurorra_index` must not import `Dialog` for address map.
- `aurorra_index` must not own address map open state.
- `aurorra_index` must not render an address map dialog.
- Address row clicks must leave the package through `callbacks.onAddressClick(address)`.

## Exact implementation
1. Delete `aurorra_index/src/features/addressmap/component/AddressMapDialog.tsx`.
2. Delete `aurorra_index/src/features/addressmap/style/addressMapDialogStyles.ts`.
3. Delete `aurorra_index/src/features/addressmap/hook/useAddressMap.ts`.
4. Delete `aurorra_index/src/features/addressmap/type/addressMap.types.ts`.
5. Update `aurorra_index/src/features/addressmap/index.ts` to export only `AddressMapContent` and address map data helpers.
6. Update `aurorra_index/src/public-api.ts` to stop exporting `AddressMapDialog`, `useAddressMap`, and `UseAddressMapResult`.
7. Update `aurorra_index/src/features/metdataview/hook/useMetadata.ts` to remove `useAddressMap` and all address map open/source/zoom return fields.
8. Update `aurora_core/src/features/metadata/component/MetadataPanel.tsx` to remove `AddressMapDialog`, `addressMapOpen`, `addressMapSource`, `addressMapZoom`, `closeAddressMap`, and `openAddressMap`.
9. Update `aurorra_index/src/features/metdataview/component/MetadataRows.tsx` so the address action renders only when `callbacks.onAddressClick` exists and calls `callbacks.onAddressClick(value)`.
10. Keep `AddressMapContent` iframe behavior unchanged: lazy loading, `referrerPolicy="no-referrer"`, fullscreen enabled, delayed source assignment, and source reset when `source` changes to empty.

## Tests
- Keep and update `aurorra_index/src/features/addressmap/test/AddressMapContent.vitest.test.tsx`.
- Keep and update `aurorra_index/src/features/addressmap/test/addressMap.vitest.test.ts`.
- Delete `aurorra_index/src/features/addressmap/test/AddressMapDialog.vitest.test.tsx`.
- Delete `aurorra_index/src/features/addressmap/test/useAddressMap.vitest.test.tsx`.
- Update `aurorra_index/src/features/metdataview/test/MetadataPanel.addressmap.vitest.test.tsx` to assert the address row calls `callbacks.onAddressClick` and no dialog role renders.
- Add or update grep assertions in tests so `aurorra_index/src/features/addressmap` contains no `Dialog` import and no `AddressMapDialog` symbol.

## Validation
Run from `aurorra_index`:
1. `npm run typecheck`
2. `npm run lint:boundary`
3. `npm run test:vitest`
4. `npm run test:visual`
5. `npm run build`

Run from `document_web` after the host plan is implemented:
1. `npm run test`
2. `npm run typecheck`
3. `npm run build`
4. `npm run test:visual`
5. Browser verify address map dialog open, iframe visibility, close, and layout

## Hard stops
- Stop if implementation needs an address map dialog inside `aurorra_index`.
- Stop if implementation needs a new event name instead of existing `callbacks.onAddressClick` and `EVENTS.showIndexAddress`.
- Stop if address map row behavior cannot be tested without package-owned dialog state.
