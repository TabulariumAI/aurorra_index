# legalmap refactor plan

## Readiness
Ready for implementation after this plan and `document_web/docs/task/addressmap-legalmap-dialog-plan.md` are implemented together.

## Goal
Remove dialog and display ownership from `aurorra_index/src/features/legalmap`. The package must expose legal map content and data helpers only. `document_web` owns open state, dialog chrome, close behavior, and placement.

## Current code reality
- `aurorra_index/src/features/legalmap/component/LegalMapDialog.tsx` wraps `LegalMapContent` in `aurora-core/Dialog`.
- `aurorra_index/src/features/metdataview/hook/useMetadata.ts` owns `legalOpen` state for the package dialog.
- `aurora_core/src/features/metadata/component/MetadataPanel.tsx` imports and renders `LegalMapDialog`.
- The legal row action already calls `callbacks.onLegalView?.(payload)` before opening the package-owned dialog.
- `document_web/src/features/metadata/legacy/metadataRuntime.ts` already defines `metadataCallbacks.onLegalView`, but it currently returns `undefined`.

## Required package contract
- `LegalMapContent` remains the only React legal map component exported by the package.
- `normalizeLegalData` and existing legal data helpers remain package data exports.
- `aurorra_index` must not import `Dialog` for legal map.
- `aurorra_index` must not own legal map open state.
- `aurorra_index` must not render a legal map dialog.
- The legal summary action must leave the package through `callbacks.onLegalView()`.

## Exact implementation
1. Delete `aurorra_index/src/features/legalmap/component/LegalMapDialog.tsx`.
2. Delete `aurorra_index/src/features/legalmap/style/legalMapDialogStyles.ts`.
3. Update `aurorra_index/src/features/metdataview/hook/useMetadata.ts` to remove `legalOpen` and `setLegalOpen`.
4. Update `aurora_core/src/features/metadata/component/MetadataPanel.tsx` to remove `LegalMapDialog`, `legalOpen`, `setLegalOpen`, and the package-local `legalPayload` lookup used only by the dialog.
5. Update the legal row action in `MetadataPanel` so `lot_block` click calls `callbacks.onLegalView?.(payload)` only.
6. Update `aurorra_index/src/public-api.ts` to export `LegalMapContent` and to avoid exporting any legal dialog symbol.
7. `LegalMapContent` groups plats by state, county, subdivision, Unit / Phase / Section, block, and lot. Drawing starts at subdivision. Matching ancestors render once; each block retains its own distinct lots. Unit / Phase / Section share one enclosing tier with named labels. Lot Block `right_of_way` values belong to their subdivision and render as separate horizontal HTML/CSS corridors with centered extracted labels, light teal fill, diagonal hatch, square corners, and thin teal top/bottom boundaries. Bands are `3rem` high; subdivision content has a `24rem` minimum height when ROWs exist. Each band center is `(i + 1) * innerHeight / (rowCount + 1)`, independent of acreage. The legend includes Right Of Way when present. Identifiers retain letters and ranges. The map scrolls independently while parcel information remains in the right column.
8. Before building that hierarchy, `toPlatJSON` uses `legals.parcels_num` as the target lot-block group count. A missing or nonpositive count uses the number of source lot-block groups. When the target is smaller, merge the pair with the most matching nonblank elements, using source order for equal weights, and recalculate weights until the target is reached. Matching values use the existing case and whitespace normalization. Retain distinct block values in slash-separated labels, preserve each right-of-way label as a separate corridor, and retain other distinct values in comma-separated labels. Leave the source payload unchanged. The one-parcel Iron Horse example renders one Lot 32 under block `1/4482C`. `LegalMapPayload` declares the count within `aurorra_index`; this change requires no service or host edits.

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
