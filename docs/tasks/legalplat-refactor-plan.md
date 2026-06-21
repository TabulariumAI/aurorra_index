# legalplat refactor plan

1. Split `document_web\src\domains\property\shell\legalviewer.js` behavior into explicit donor responsibilities before implementation.
   a. Data responsibilities belong to `aurorra_index\src\features\legalplat\data`.
      - Preserve the `LegalViewer.show()` flow where raw `legalJSON` is normalized before rendering.
      - Preserve the normalized view model fields: `subdivisions`, `location`, `platName`, `presentLayers`, `matchPlatSubdivision`, `isEmptyStructure`, and `locationLabel`.
      - Preserve data-derived display helpers used by rendering: blank detection, common prefix stripping, digit-preferred labels, number counting, size scaling, present-layer detection, and empty-structure detection.
      - Keep donor normalization source aligned with `document_web\src\domains\property\data\legaldatahelper.js`.
   b. React component responsibilities belong to `aurorra_index\src\features\legalplat\component`.
      - Convert `LegalViewerContent.render()` and its private DOM render methods into React components.
      - Preserve empty-state rendering text: `No valid property hierarchy data found.`
      - Preserve subdivision, phase, block, lot, condominium unit, legend, and location rendering behavior.
      - Preserve lot grid behavior: 3 rows, 3 columns, minimum 9 lots, maximum 99 donor lots, and condominium range spanning behavior.
      - Remove dialog/frame ownership from the package feature; `LegalViewerFrame`, `Dialog`, host element validation, `open`, `hide`, and `close` are legacy shell concerns and must not move into `aurorra_index`.
      - `LegalPlatView` must stay a pure content component that receives `legal` data and renders only the plat hierarchy and the empty state.
      - `LegalPlatView` must not own modal state, overlay rendering, keyboard handling, or any shell-level open/close behavior.
   c. Styling responsibilities belong to `aurorra_index\src\features\legalplat\style`.
      - Move donor colors, sizing constants, grid spacing, borders, background image usage, typography, and scroll behavior out of component logic.
      - Components may consume style tokens/classes only; no imperative `Object.assign(...style)` pattern may remain in the React implementation.
   d. Acceptance checks for item 1.
      - The plan identifies every donor responsibility before implementation starts.
      - No dialog, global export, host DOM mutation, or legacy `Dialog` dependency is assigned to `aurorra_index`.
      - The future implementation path is data -> component -> style, with no mixed ownership.
2. Rebuild `aurorra_index\src\features\legalplat` as a pure React implementation.
   a. Keep `aurorra_ui` as the dialog shell dependency.
      - Use `aurorra_ui\src\dialog` `Dialog` for the legal modal surface.
      - Keep dialog behavior in the shell: `open`, `onOpenChange`, overlay handling, close button, title, and z-index live outside the legal-plat feature.
      - Do not reintroduce a local controller, host mount, or direct `@radix-ui/react-dialog` dependency inside `aurorra_index` for this feature.
      - Prefer the package export `aurorra-ui` `Dialog` component rather than importing Radix primitives directly in `aurorra_index`.
   b. Shell composition responsibilities belong to `aurorra_index\src\features\metdata\component\MetadataPanel`.
      - `MetadataPanel` should own `legalOpen` state and pass it to `aurorra_ui` `Dialog`.
      - `MetadataPanel` is not the dialog; it is the shell container that triggers and hosts the modal.
      - `aurorra_ui` `Dialog` is the actual modal surface and owns overlay, escape, close button, title, and stacking behavior.
      - The dialog content should be `LegalPlatView` only; no shell markup should leak into the legal plat component.
      - The close affordance must remain inside `aurorra_ui` `Dialog`, not in `MetadataPanel`, so the shell stays declarative.
   c. Acceptance checks for item 2.
      - The legal plat component renders without dialog concerns when rendered by itself.
      - The metadata shell can open and close the legal plat modal using the shared `aurorra-ui` dialog.
      - The legal plat modal does not depend on donor DOM APIs, controller classes, or host element mutations.
3. Move donor data-normalization behavior into `aurorra_index\src\features\legalplat\data`.
   a. Convert `document_web\src\domains\property\data\legaldatahelper.js` into TypeScript normalization logic.
      - Parse legal input into subdivision, track, phase, block, lot, and condominium unit structure.
      - Extract location and plat fields from the donor payload.
      - Produce the normalized model used by the React component.
      - Read `legalJSON` from the local store in `aurorra_index\src\store`.
      here is how to get legalJSON;
      const legalJSON = useStore((state) => state.getJSON(session)?.legalJSON ?? null);
4. Move donor rendering behavior into `aurorra_index\src\features\legalplat\component`.
5. Keep presentation-only styling inside `aurorra_index\src\features\legalplat\style`.
6. Add and update tests for data normalization and React rendering parity.
   - Add shell-level dialog tests for `MetadataPanel` against `aurorra_ui` `Dialog` integration.
   - Keep legal-plats content tests separate from modal-shell tests so feature ownership stays clear.
