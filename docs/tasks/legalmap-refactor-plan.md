# legalmap refactor plan

## Readiness
Ready for implementation after this plan and `document_web/docs/task/addressmap-legalmap-dialog-plan.md` are implemented together.

## Goal
Remove dialog and display ownership from `aurorra_index/src/features/legalmap`. The package must expose legal map content and data helpers only. `document_web` owns open state, dialog chrome, close behavior, and placement.

## Current code reality
- `aurorra_index/src/features/legalmap/component/LegalMapDialog.tsx` wraps `LegalMapContent` in `aurorra-ui/Dialog`.
- `aurorra_index/src/features/metdataview/hook/useMetadata.ts` owns `legalOpen` state for the package dialog.
- `aurorra_index/src/features/metdataview/component/MetadataPanel.tsx` imports and renders `LegalMapDialog`.
- The legal row action already calls `callbacks.onLegalView?.(payload)` before opening the package-owned dialog.
- `document_web/src/features/metadata/legacy/metadataRuntime.ts` already defines `metadataCallbacks.onLegalView`, but it currently returns `undefined`.

## Required package contract
- `LegalMapContent` remains the only React legal map component exported by the package.
- `normalizeLegalData` and existing legal data helpers remain package data exports.
- `aurorra_index` must not import `Dialog` for legal map.
- `aurorra_index` must not own legal map open state.
- `aurorra_index` must not render a legal map dialog.
- Legal row clicks must leave the package through `callbacks.onLegalView(payload)`.

## Exact implementation
1. Delete `aurorra_index/src/features/legalmap/component/LegalMapDialog.tsx`.
2. Delete `aurorra_index/src/features/legalmap/style/legalMapDialogStyles.ts`.
3. Update `aurorra_index/src/features/metdataview/hook/useMetadata.ts` to remove `legalOpen` and `setLegalOpen`.
4. Update `aurorra_index/src/features/metdataview/component/MetadataPanel.tsx` to remove `LegalMapDialog`, `legalOpen`, `setLegalOpen`, and the package-local `legalPayload` lookup used only by the dialog.
5. Update the legal row action in `MetadataPanel` so `lot_block` click calls `callbacks.onLegalView?.(payload)` only.
6. Update `aurorra_index/src/public-api.ts` to export `LegalMapContent` and to avoid exporting any legal dialog symbol.
7. Keep `LegalMapContent` rendering unchanged: empty state, subdivision, phase, block, lot, condominium unit, legend, and location label.

## Tests
- Keep and update `aurorra_index/src/features/legalmap/test/LegalMapContent.vitest.test.tsx`.
- Keep and update `aurorra_index/src/features/legalmap/test/legalData.vitest.test.ts`.
- Delete `aurorra_index/src/features/legalmap/test/LegalMapDialog.vitest.test.tsx`.
- Update `aurorra_index/src/features/metdataview/test/MetadataPanel.legalmap.vitest.test.tsx` to assert the legal row calls `callbacks.onLegalView` and no dialog role renders.
- Add or update grep assertions in tests so `aurorra_index/src/features/legalmap` contains no `Dialog` import and no `LegalMapDialog` symbol.

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
5. Browser verify legal map dialog open, content visibility, close, and layout

## Hard stops
- Stop if implementation needs a legal map dialog inside `aurorra_index`.
- Stop if implementation needs a new legal trigger instead of existing `callbacks.onLegalView`.
- Stop if legal row behavior cannot be tested without package-owned dialog state.
