# Document Image Viewer Implementation Contract

## Scope
The document image viewer is owned by `aurorra_index/src/features/imageviewer`.

`document_web` owns only app event handling and placement:
- Studio mode portals the viewer into `#preview-container`.
- Tablet and kiosk modes render the viewer inside the existing `aurorra-ui` dialog.
- Viewer errors are bubbled through the host alert path.

## Active Flow
1. Metadata page actions in `aurorra_index` write the active image viewer request into `imageViewerStore`.
2. `document_web` handles `EVENTS.showDocumentPage`, sets `layout_type` to `DOCUMENTPAGE`, and mounts `DocumentHost`.
3. `DocumentHost` resolves host inputs and passes them to `ImageViewerPanel`.
4. `ImageViewerPanel` requests image package generation through `POST /v1/image/{session}/package`.
5. `ImageViewerPanel` polls `GET /v1/image/{session}/status`.
6. After `completed`, `ImageViewerPanel` calls `GET /v1/image/{session}/data`.
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
10. `useImageViewer` creates read-only `AuroraLens`, loads metadata, decodes the multipage TIFF, navigates to the requested page, and applies local search.

## Ownership Rules
`aurorra_index` owns:
- Image package API worker and client.
- Image package response parsing and URL validation.
- TIFF and package JSON download.
- TIFF bytes, metadata, request state, package status, Lens status, and toolbar state.
- Aurora Lens lifecycle through `useImageViewer`.
- Toolbar rendering, search, zoom, fit, page navigation, thumbnails, and visual tests.

`document_web` owns:
- `EVENTS.showDocumentPage` orchestration.
- `DocumentHost` placement.
- Existing metadata focus and segment expansion behavior.
- Host alert rendering for bubbled viewer errors.

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
- `src/features/imageviewer/hook/useImageViewer.ts`
- `src/features/imageviewer/store/imageViewerSessionStore.ts`
- `src/features/imageviewer/store/imageViewerStore.ts`
- `src/features/imageviewer/style/imageViewerStyles.ts`
- `src/features/imageviewer/type/imageViewer.types.ts`
- `src/features/imageviewer/worker/ImageWorker.ts`
- `src/features/imageviewer/worker/imageWorkerClient.ts`
- `src/features/imageviewer/index.ts`

`document_web` production files:
- `src/features/document/component/DocumentHost.tsx`
- `src/features/document/legacy/documentRuntime.ts`
- `src/features/document/type/document.types.ts`

## UI Contract
The dialog title is `Document Image`.

Top toolbar:
- Zoom out
- Zoom in
- Fit width
- Fit height
- Fit page
- Actual size
- Search input
- Search
- Clear search

Footer toolbar:
- Thumbnails
- First page
- Previous page
- Current page / total pages
- Next page
- Last page

Thumbnail mode hides the top and footer toolbars.

## Validation
Required gates before commit:
- `aurorra_index npm run test:vitest`
- `aurorra_index npm run typecheck`
- `aurorra_index npm run lint:boundary`
- `aurorra_index npm run test:visual -- tests/visual/imageviewer.visual.spec.ts`
- `aurorra_index npm run build`
- `document_web npm run test:vitest -- src/features/document/test/DocumentHost.vitest.test.tsx`
- `document_web npm run typecheck`
- `document_web npm run test:visual -- tests/playwright/visual/document-viewer.visual.spec.ts`
- `document_web npm run build`
- `git diff --check` in both repos
