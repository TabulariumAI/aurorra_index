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
7. `LegalMapContent` groups plats by State / County / Jurisdiction / City, Subdivision / Condominium, Phase / Unit / Section, Block / Tract / Building, and Condo Unit / Lot / Parcel. Level 0 labels appear inside the map surface at the bottom, below the drawing and legend, level 1 above it, level 2 to the left, level 3 in the center, and level 4 in perimeter cells. Drawing starts at subdivision. Matching ancestors render once; each block retains its own distinct lots. Phase / Unit / Section share one enclosing tier with named labels. Lot Block `right_of_way` values belong to their subdivision and render as separate horizontal HTML/CSS corridors with centered extracted labels, light teal fill, diagonal hatch, square corners, and thin teal top/bottom boundaries. Bands are `3rem` high; subdivision content has a `24rem` minimum height when ROWs exist. Each band center is `(i + 1) * innerHeight / (rowCount + 1)`, independent of acreage. The legend includes Right Of Way when present. Identifiers retain letters and ranges. The map scrolls independently while parcel information remains in the right column.
8. Before building that hierarchy, `toPlatJSON` uses `legals.parcels_num` as the target lot-block group count. A missing or nonpositive count uses the number of source lot-block groups. When the target is smaller, merge the pair with the most matching nonblank elements, using source order for equal weights, and recalculate weights until the target is reached. Matching values use the existing case and whitespace normalization. Retain distinct Block, Tract, and Building values in slash-separated labels, preserve each right-of-way label as a separate corridor, and retain other distinct values in comma-separated labels. Leave the source payload unchanged. The one-parcel Iron Horse example renders one Lot 32 under block `1/4482C`. `LegalMapPayload` declares the count within `aurorra_index`; this change requires no service or host edits.

The Lot & block grid retains its twelve perimeter lot positions. Source Block, Tract, and Building labels occupy the merged center. Without any of these labels, the center contains four empty bordered cells, completing the 4-by-4 schematic grid. Empty center cells carry no lot identifiers or acreage; all cells reuse the existing lot renderer and palette. Available State, County, Jurisdiction, and City come from the corresponding map's source groups and appear inside the map surface at the bottom, below the drawing and legend, in that order. Location labels remain outside the fitted drawing and horizontal drawing scroller, using the shared map surface caption layout. Condo Units, Lots, and Parcels retain distinct typed identities, even when their identifiers match. Condo Unit and Parcel values remain verbatim; existing numeric lot parsing and lot acreage ownership are preserved. Narrow panels retain the existing 30rem natural drawing width and expose keyboard-accessible horizontal scrolling. The shared parcel area owns vertical scrolling; wider panels retain fitting and divider resizing.

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

## Shared map layout

Summary is followed by the right-aligned map-view tabs, including a single available view. All views use one parcel scroll area, centered parcel headings above the shared map surface, and the same resizable data area for schematic views. Entries containing only unpositioned data omit the empty map and splitter. A single data category has no tab row; multiple categories retain keyboard-accessible tabs.

Lot, block and tract labels use the existing 16px base sizes. Each parcel in Metes & Bounds and PLSS uses the available map viewport height and refits proportionally as the splitter moves. Lot & Block retains proportional fitting in wider panels and its 30rem natural drawing width with horizontal scrolling in narrow panels. When all parcels in a view lack geometry, their issues and measurements share the existing data-only scroll area without a blank map viewport or splitter. A missing-geometry parcel beside drawable parcels keeps a compact issue card in the map scroller. An explicit unique parcel number in extracted explanations is retained in its map heading and details. Labels that do not fit are hidden while the original values remain in data. Block, Tract, and Building share the center tier through one rendering path and retain their own captions and typed Lot or Condo Unit leaves. Unpositioned aspects, including Subdivision Procedural, appear only in data. Acreage callouts stay outside the lot with pointers ending inside it. Survey point numbers move into available space with thin leaders to their exact points. Numbers that cannot fit remain accessible by hovering or focusing their point; the active number takes precedence. Map height and text size stay unchanged; geometry, warning markers, and full call data remain available.

`LegalMapContent.addressMaps` accepts address map entries. The host reads every nonblank property-address index and normalizes each address. When `parcels_num` is `1`, it sends all addresses together in one Google query joined with ` OR `; Google resolves the query. Otherwise, each address retains its own map. Address text appears only in the Google map card. No external address heading, details table or divider is rendered. Address records are not assigned parcel numbers.

Single-parcel schematic headings are hidden. North and the legend share one footer row. Legend items stay together, wrap to at most two rows, and further rows are clipped.

## Metes and bounds matrix

`getMapGroups` uses `buildMatrix`. The original `buildBoundary` and `parseMetesAndBounds` remain available for switching back; both paths share measurement conversion and drawing. The new path collects bearings and distances from both metadata fields, irrespective of field names. It preserves complete embedded pairs, repeated entries, blank or unreadable list positions and explicit source associations. Complete metadata pairs are not replaced by differing source measurements. Separate measurements pair by sequence without discarding every row when counts differ. Unmatched measurements retain their position in the measurement list. `SUBSTANTIALLY DUE NORTH` retains its supplied text and resolves to North.

The matrix first keeps its existing pairs and ordering. One missing bearing or distance can be calculated from the known courses and the next known section, including the closing anchor. A calculated border remains Unconfirmed, retains any supplied distance, uses degree/minute/second bearing notation and exposes the calculated length in its tooltip. Other supplied measurements keep their own confirmation status. Multiple unresolved courses remain Unconfirmed. Invalid or zero distances and invalid bearings are not repaired as missing measurements. Connector alignment and shape closure use the same 0.001 perimeter ratio, including the calculated connector and commencement distances.

A candidate outline must close within the existing tolerance, have nonzero area and have no crossing borders. If its existing order fails, the solver tries border ordering while preserving embedded pairs. Only when that fails does it retry bearing-distance assignments across the supplied measurements, including measurements that originally arrived as pairs. Supplied bearing angles and compass directions are not changed. Changed supplied pairings remain Unconfirmed and expose their original distances. Each candidate recalculates its single unresolved connector before validation; missing or invalid measurements are not used as replacement distances. Different valid outlines remain Unconfirmed; translated representations of the same outline are one shape. Axis bounds prune only assignments that cannot reach closure; they do not limit the search or choose between valid candidates. Reassigned pairs update their displayed course details. Unchanged matrix results reuse the existing drawing. Commencement offsets and straight boundaries preceding curves pass through the same matrix validation. Source curves, commencement offsets, explicit beginning anchors, source-only calls and courses following an existing closed parcel retain their established construction. Supplied metadata is never changed.

Distances use metres internally. Closure tolerance is 0.001 times the course distances through each candidate endpoint, including ties. Existing source construction compares successive endpoints to points 1, 2, then 3 in that order; confirmed, nonzero-area loops establish zero, one, or two starting ties and the closing course. Its closing endpoint snaps to the matched point while retaining the original measurements. The matrix validates the resulting outline and can also close a unique simple outline using an explicitly Unconfirmed calculated connector. Later courses remain separately drawn at their measured endpoints, are marked Unconfirmed with amber table backgrounds, and do not enter the parcel fill. A review notice identifies additional courses after closure. Ties use very light dotted lines. Zero-area traverses remain unfilled.

One parcel combines all its Metes groups in one map. Two parcels with two groups render two maps. Single-parcel Metes maps omit the parcel heading. Boundary tables omit the Issue column and scroll horizontally on narrow screens. POC and POB labels take precedence over inactive point numbers; the hovered or focused point number takes precedence over both. One placement routine keeps these labels clear of other visible labels, survey points, and boundary line segments. Resizing repositions labels without changing the measured geometry or font sizes; displaced point numbers retain leaders to their exact points.

Boundary Calls and extracted-measurement cards abbreviate compass directions, angular units and distance units while retaining the original source values. Each Unconfirmed status exposes its course-specific reason through the existing Radix tooltip pattern on hover and keyboard focus. Reasons distinguish commencement offsets, unreadable bearings, missing distances, zero distances, curve geometry, dependent positions and courses after a closed parcel.

The same entry parser reads combined bearings and distances from either metadata field, in either order. List splitting preserves bearing punctuation, compound distances, thousands separators and repeated calls. Complete embedded pairs are preserved during initial matching and border ordering; the final retry may reassign their distances only after those stages fail to close a valid shape. Intact source curves and commencement calls retain their existing positional context. Frontage descriptions retain every measurement: FRONT/REAR without directions remain Unconfirmed, and subsequent explicit N/S courses use dashed schematic geometry without a parcel fill.
