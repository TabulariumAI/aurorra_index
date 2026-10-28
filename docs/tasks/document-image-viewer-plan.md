# Document Image Viewer Implementation Contract

## Scope
The document image viewer is owned by `aurorra_index/src/features/imageviewer`.

`document_web` owns only app event handling and placement:
- Studio mode portals the viewer into `#preview-container`.
- Tablet and kiosk modes render the viewer inside the existing `aurora-core` dialog.
- Viewer errors are bubbled through the host alert path.

## Active Flow
1. Metadata page actions in `aurorra_index` write the active image viewer request into `imageViewerStore`.
2. `metadataCallbacks.onPageClick` invokes the named `showDocumentPage` operation in `document_web/src/orchestration/flow/show-document-page/flow.ts`. That operation activates the image panel and sets the app store's `layoutType`, `layoutPage`, and selected index.
3. `ImageViewerHost` resolves host inputs and passes them to `ImageViewerPanel`.
4. `ImageViewerPanel` retrieves the package through `GET /v1/image/{session}/data`, without a metadata ETag.
5. Intake and explicit recovery use `POST /v1/image/{session}/generate` with `{}`.
6. `user_svc` reuses valid success-flag TIFF/JSON paths for GET; missing, empty, or malformed paths and missing success trigger generation. It waits for generation in `document_svc` and returns signed URLs.
7. The package data response must be:

```json
{
  "status": "completed",
  "data": {
    "tiff": "https://...",
    "data": "https://..."
  }
}
```

8. `ImageWorker` downloads the TIFF and JSON URLs.
9. `ImageWorker` parses the JSON metadata and returns TIFF bytes plus metadata to `imageViewerStore`.
10. `useImageViewer` creates read-only `AuroraLens`, loads metadata, decodes the multipage TIFF, navigates to the requested page, and invokes Aurora Lens Search or index Highlight.
11. Export opens Add Index with selected value, source context, and the current page name. Copy writes only the selected value to the clipboard. Match scores metadata value and source tokens at 80% confidence, uses page name to break ties, and focuses the winning visible index.

## Ownership Rules
`aurorra_index` owns:
- Image package API worker and client.
- Image package response parsing and URL validation.
- TIFF and package JSON download.
- TIFF bytes, metadata, request state, package status, Lens status, and toolbar state.
- Aurora Lens lifecycle through `useImageViewer`.
- Toolbar rendering, forwarding Search and Select inputs to Aurora Lens, zoom, fit, page navigation, thumbnails, and visual tests.
- Matching exported image selections back to metadata rows and rendering the visible no-match result.

`aurora-lens` owns image-text Search, index Highlight, selection export without clipboard writes, value-only copy, and current page-name lookup. Search returns all complete exact and fuzzy occurrences. Index Highlight receives the index value and source from `aurorra_index` and uses the shared matcher with value token order disabled. It returns one result, ranking complete value matches first, then source-term coverage, then lowest Fuse score; ties retain the first metadata occurrence. Highlight returns a boolean. `aurorra_index` displays its no-match status when Highlight returns `false`. Aurora Lens does not depend on `aurorra_index`.

`document_web` owns:
- The named `showDocumentPage` orchestration operation.
- App shell preview placement through `ImageViewerHost`.
- Existing metadata focus and segment expansion behavior.
- Expanding a matched segment and shaking the metadata panel when Match finds the already selected index.
- Local error rendering for reported viewer errors.

`document_web` must not:
- Download TIFF or package JSON.
- Parse package data.
- Own Lens lifecycle.
- Render viewer toolbar controls.
- Use `DocViewer`, `DocView`, `DocAdapter`, or `DocController.showPage` for active document image display.

## File Map
`aurorra_index` production files:
- `src/features/imageviewer/component/ImageViewerPanel.tsx`
- `src/features/imageviewer/component/ImageViewerToolbar.tsx`
- `src/features/imageviewer/data/imageViewerData.ts`
- `src/features/imageviewer/data/loadImagePackage.ts`
- `src/features/imageviewer/data/matchSelection.ts`
- `src/features/imageviewer/hook/useImageViewer.ts`
- `src/features/imageviewer/store/imageViewerStore.ts`
- `src/features/imageviewer/style/imageViewerStyles.ts`
- `src/features/imageviewer/type/imageViewer.types.ts`
- `src/features/imageviewer/worker/ImageWorker.ts`
- `src/features/imageviewer/worker/imageWorkerClient.ts`
- `src/features/imageviewer/index.ts`

`document_web` production files:
- `src/features/document/component/ImageViewerHost.tsx`
- `src/features/document/shared/documentService.ts`
- `src/features/document/type/document.types.ts`
- `src/features/metadata/shared/metadataService.ts`
- `src/shell/application/store/shellStore.ts`
- `src/shell/application/component/AppShell.tsx`
- `src/orchestration/flow/show-document-page/flow.ts`

## UI Contract
The dialog title is `Document Image`.

Top toolbar:
- Zoom out
- Current scale
- Zoom in
- Scale options menu: Fit page, Fit width, Fit height, Actual size
- Search input with Search button inside its border
- Select mode and adjacent Clear selections
- More menu: Export, Copy, Match

The top toolbar stays on one row. Only the search form resizes; its text input has a 7rem minimum width. The form hides when the measured view controls, search button, selection controls, borders, gaps, and minimum input cannot fit together. Match expands the winning metadata segment. Matching the selected index shakes the metadata panel. A failed match shows an accessible in-view status.

Footer toolbar:
- Thumbnails
- First page
- Previous page
- `Page [position] ([name]) of [count]`; omit the name and parentheses when no mapped name is available. Position is `ViewerState.pageIndex + 1`; the optional name is `ViewerState.pageName`.
- Next page
- Last page

Thumbnail mode hides the top and footer toolbars.

## Validation
Required gates before commit:
- `aurora-lens npm test`, `npm run lint`, `npm run build`, and Edge browser test
- `aurorra_index npm run test:vitest`
- `aurorra_index npm run typecheck`
- `aurorra_index npm run lint:boundary`
- `aurorra_index npm run test:visual -- tests/visual/imageviewer.visual.spec.ts`
- `aurorra_index npm run build`
- `document_web npm run test:vitest -- src/features/document/test/ImageViewerHost.vitest.test.tsx`
- `document_web npm run typecheck`
- `document_web npm run test:visual -- tests/playwright/visual/document-viewer.visual.spec.ts`
- `document_web npm run build`
- `git diff --check` in both repos
