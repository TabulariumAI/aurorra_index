# Metadata Refinement Plan

## Goal

Move metadata reprocess, confirm, drop, and page-segment editing to pure React features in `aurorra_index`. `document_web` remains the host: it decides where the page-segment panel is displayed and handles package outcome events.

Chat/refine is explicitly out of scope. Do not move or change the chat dialog, chat history, chat submit route, or chat-triggered reprocess path.

## Current Code Reality

- `src/features/metdataview/component/MetadataPanel.tsx` and `MetadataRows.tsx` render metadata actions through host callbacks.
- `src/features/metdataview/hook/useMetadata.ts` loads metadata JSON through `GET /v1/index/{session}/data`.
- `src/features/metdataview/worker/metdataWorker.ts` and `metadataWorkerClient.ts` are the package worker/client pattern for authenticated metadata requests.
- `document_web/src/features/metadata/legacy/metadataRuntime.ts` currently performs reprocess, confirm, and drop through the legacy worker path.
- `document_web/src/domains/refine/svc/refine_service.js` opens the legacy `PageSegmentsDialog` after `EVENTS.reFinePage`.
- `document_web/src/domains/shared/viewer/shell/pagesegmentsdialog.js` renders the legacy page-segment UI. Its Submit and Reprocess callbacks only show success state; they do not call the page-segment endpoint.
- `user_svc` exposes the required authenticated public routes:
  - `POST /v1/reprocess/{session}/{segment}`
  - `POST /v1/reprocess/{session}/confirm/{code}`
  - `POST /v1/reprocess/{session}/drop/{code}`
  - `POST /v1/reprocess/{session}/page/{code}/segments`

## Scope

### In Scope

- Metadata section reprocess.
- Metadata index confirm.
- Metadata index drop.
- Page-segment panel and `POST /v1/reprocess/{session}/page/{code}/segments`.
- Typed package-to-host action completion and failure callbacks.
- Removal of the legacy page-segment display path after the host replacement is active.

### Out of Scope

- Chat/refine UI, submit request, history, and chat dialog.
- New chat package work.
- Changes to `user_svc` or the API contract.
- New metadata retrieval when a user opens page-segment editing. Page code, class, selected segments, and choices come from the metadata already loaded by `aurorra_index`.

## Ownership

| Concern | Owner |
|---|---|
| Loaded metadata and current page-segment data | `aurorra_index` metadata feature |
| Reprocess, confirm, and drop requests | `aurorra_index` metadata feature |
| Page-segment update request and checkbox state | `aurorra_index` page-segment feature |
| Metadata row action payload | `aurorra_index` metadata feature |
| Page-segment panel placement, open state, close behavior, and host notifications | `document_web` |
| Alerts, audit refresh, and any host-specific reaction | `document_web` |

`aurorra_index` must not import `EventBus`, `EVENTS`, legacy workers, globals, or `document_web` files. The existing boundary checker must continue to enforce this.

## Package Contracts

### Metadata Action Requests

Extend the existing metadata worker/client contract in `src/features/metdataview` with typed commands and client methods for these exact requests. Reuse the `IqWorker` multi-command pattern and the existing `IndexWorker` response/error handling pattern.

| Action | Method and URL | Body | Success state |
|---|---|---|---|
| Reprocess | `POST /v1/reprocess/{session}/{segment}` | `{}` | Reload metadata, preserve the requested open segment, then notify the host. |
| Confirm | `POST /v1/reprocess/{session}/confirm/{code}` | no body | Queue the confirmation and apply it locally before background processing. |
| Drop | `POST /v1/reprocess/{session}/drop/{code}` | no body | Remove the code from the rendered metadata, clear matching selection, then notify the host. |

All requests use `apiGatewayUrl` and `authToken` already supplied to `IndexMetadata`. They send `Authorization: Bearer <token>` and preserve the existing typed worker error shape.

`POST /reprocess/{session}/{segment}` always receives one metadata segment. It is not used by page-segment editing.

Use these exact worker commands and client methods:

| Command `type` | Client method |
|---|---|
| `reprocessSegment` | `reprocessSegment(token, session, segment)` |
| `confirmIndex` | `confirmIndex(token, session, code)` |
| `dropIndex` | `dropIndex(token, session, code)` |

Use these exact response rules:

- Reprocess succeeds only for HTTP `200` JSON shaped as `{ "status": "completed", "data": "string" }`. A valid body with any other status returns `reprocess_not_completed`.
- Confirm and drop succeed only for HTTP `200` JSON shaped as `{ "applied": true, "patches": number }`. A valid body with `applied: false` returns `index_not_applied`.
- For all non-`2xx` responses, parse the backend `{ "code": "string", "message": "string" }` error into `MetadataError`.
- A malformed success body is a typed `validation_error`; do not infer success from HTTP status alone for reprocess, confirm, or drop.

### Page-Segment Panel

Create a separate pure React page-segment feature under `src/features/pagesegments` and export its panel and types from `src/public-api.ts`.

Use this exact panel contract:

```ts
export type PageSegmentsPanelProps = {
  apiGatewayUrl: string;
  authToken: string;
  choices: MetdataChoice[] | string | null;
  onClose: () => void;
  batchCode: string | null;
  intervalMs: number;
  retryIntervalMs: number;
  retryLimit: number;
  onReadyChange(ready: boolean): void;
  onError: (event: PageSegmentsFailure) => void;
  pageClass: string;
  pageCode: string;
  segments: string[];
  session: string;
  workerClient?: MetdataWorkerClient;
};
```

The panel uses Zustand for its selected page-segment state and Radix UI components already used in the package. It must not retrieve page data on open.

The panel submits only:

```http
POST /v1/reprocess/{session}/page/{code}/segments
Authorization: Bearer <token>
Content-Type: application/json

{ "segments": ["..."] }
```

Submit enqueues a page change in the shared index queue, projects its segments into the package metadata cache, and calls `onClose` after acceptance. The queue uses the existing page worker, then reloads metadata after success. It does not call the single-segment reprocess route.

Use the exact page-segment worker command `type: "updatePageSegments"` and client method `updatePageSegments(token, session, pageCode, segments)`. A page-segment update succeeds only for HTTP `200` with an empty body. A non-empty HTTP `200` body returns `validation_error`. Parse non-`2xx` backend `{ code, message }` responses into `PageSegmentsWorkerError`; `404 page_segments_page_not_found` leaves a failed task available for retry or cancellation. Cancellation restores the committed page segments.

Export these exact page-segment types:

```ts
export type PageSegmentsFailure = {
  error: PageSegmentsWorkerError;
  pageCode: string;
  session: string;
};
```

`PageSegmentsPanelProps.onError` receives `PageSegmentsFailure` for acceptance errors. Background failures appear on the affected metadata item with `QueueActions`. `onClose` receives no arguments.

Use this exact Zustand state contract in `pageSegmentsStore.ts`:

```ts
export type PageSegmentsStatus = "idle" | "saving" | "error";

export type PageSegmentsStore = {
  committed: string[];
  error: PageSegmentsWorkerError | null;
  selected: string[];
  status: PageSegmentsStatus;
  reset: (segments: string[]) => void;
  restore: () => void;
  setError: (error: PageSegmentsWorkerError) => void;
  setSelected: (segments: string[]) => void;
  setSaving: () => void;
};
```

`reset(segments)` initializes `committed` and `selected` from the panel input with `status: "idle"` and `error: null`. `restore()` copies `committed` to `selected` and clears status/error. The panel resets the store from props when `pageCode` or input `segments` changes and resets it on unmount.

### Package-to-Host Events

Extend `MetadataCallbacks` with these exact types and callback names:

```ts
export type MetadataAction =
  | { action: "reprocess"; segment: string; session: string }
  | { action: "confirm"; code: string; session: string }
  | { action: "drop"; code: string; session: string };

export type MetadataActionFailure = {
  action: MetadataAction;
  error: MetadataError;
};

export type MetadataCallbacks = {
  // Existing non-mutation callbacks remain unchanged.
  onActionComplete?: (event: MetadataAction) => void;
  onActionError?: (event: MetadataActionFailure) => void;
};
```

Remove `onConfirmIndex`, `onDropIndex`, `onReprocessSegment`, and `onReprocessComplete` from the public host callback contract after their implementations move into the package. Keep `onEditPage` unchanged because it is the package-to-host open request for `PageSegmentsHost`.

The package calls completion only after its own state has been updated:

- after reprocess metadata reload completes;
- confirm/drop use queue notifications instead of completion callbacks;
- after page-segment update updates the package metadata cache.

The package never displays host alerts, opens host dialogs, or emits global events.

## Implementation

### 1. Metadata Action Worker and Types

Update these files:

- `src/features/metdataview/type/metadataView.types.ts`
- `src/features/metdataview/worker/metdataWorker.ts`
- `src/features/metdataview/worker/metadataWorkerClient.ts`
- `src/features/metdataview/hook/useMetadata.ts`
- `src/features/metdataview/component/MetadataPanel.tsx`
- `src/features/metdataview/component/MetadataRows.tsx`
- `src/public-api.ts`

Required changes:

- Add command discriminants `reprocessSegment`, `confirmIndex`, and `dropIndex` with the exact client methods specified above.
- Build the exact `user_svc` routes, URL-encode session, segment, and code, and send the exact required bodies.
- Keep `IndexWorker` as the metadata feature's single typed worker boundary. Do not add a legacy adapter or direct `fetch` call in a component or hook.
- Move the three action requests from host callbacks into `useMetadata`.
- Queue confirm/drop, update the shared metadata cache immediately, and disable affected rows using gray styling and the change-specific left border.
- After reprocess, reload metadata through the existing worker and re-open the reprocessed segment.
- Reprocess calls `onActionComplete` after its metadata reload; reprocess failures call `onActionError` once. Index queue failures expose Retry/Cancel directly on their metadata items.
- Keep page edit as a typed host callback. It opens the host-owned `PageSegmentsHost`; it does not open a dialog in `aurorra_index`.

### 2. Page-Segment Feature

Create these files:

- `src/features/pagesegments/component/PageSegmentsPanel.tsx`
- `src/features/pagesegments/data/pageSegmentsData.ts`
- `src/features/pagesegments/store/pageSegmentsStore.ts`
- `src/features/pagesegments/style/pageSegmentsStyles.ts`
- `src/features/pagesegments/type/pageSegments.types.ts`
- `src/features/pagesegments/worker/PageSegmentsWorker.ts`
- `src/features/pagesegments/worker/pageSegmentsWorkerClient.ts`
- `src/features/pagesegments/index.ts`

Use the legacy `document_web/src/domains/shared/viewer/shell/pagesegmentsdialog.js` as the behavior and content source only. Recreate it as React; do not import, wrap, or retain the legacy DOM class.

Required behavior:

- Preserve the existing supported segment values, ordering, labels, and `choices` filtering.
- Initialize checkbox state from the metadata page payload passed by the host.
- Submit the selected list to the page-segment route exactly once per Submit action.
- Close calls `onClose`. Cancel calls `restore()` and keeps the panel open. Submit closes the panel after queue acceptance.
- Do not add a page-level reprocess action because the single-segment endpoint is not a page-segment update API.
- Project submitted segments immediately and disable the page row with a light green left border while its task remains unfinished.
- Call `onError` with `PageSegmentsFailure` for an acceptance failure; background worker failures remain on the disabled page item.
- Do not fetch metadata, read globals, use `EventBus`, or decide dialog placement.

### 3. Metadata Cache Update

Add a metadata data helper and tests that locate a page by its code in either `pages.recordables` or `pages.nonrecordables` and replace only that page's `segments` value. It must update the package's existing `jsonBySession` state without changing unrelated metadata sections.

The queue reuses the shared core metadata split, page replacement, and compose functions. The form owns checkbox state; the queue owns metadata projection, processing, retry, and cancellation.

### 4. Legacy Removal Boundary

Do not change chat behavior. Remove only the page-segment ownership from the legacy refine path:

- Remove `RefineController.showPage`, page-segment dialog state, and the `EVENTS.reFinePage` listener from `document_web/src/domains/refine/svc/refine_service.js`.
- Remove the active import and use of `pagesegmentsdialog.js` and delete that file with its tests after `PageSegmentsHost` is wired and verified.
- Do not remove `RefineDialog`, chat history, chat submit, `RefineController.showSegment`, `RefineController.showIndex`, or the chat reprocess path.

The `document_web` plan owns the host edits and exact legacy deletion list.

## Tests

Add or update Vitest coverage for:

- worker route, method, headers, body, URL encoding, successful response, network failure, HTTP failure, non-JSON success response, and malformed response for all four routes;
- metadata reprocess reload and requested segment preservation;
- confirm state update, drop state update, and selection clearing;
- package completion and failure callback payloads;
- page-segment initialization, ordering, choices filtering, submit body, immediate closure, queue failure recovery, close, and cancel;
- metadata cache replacement for both recordable and nonrecordable pages;
- no page metadata GET occurs when the page-segment panel opens;
- reprocess, confirm, and drop rows call their exact package-owned client methods; page edit calls only `onEditPage`;
- package boundary check rejects forbidden legacy/global dependencies.

Add a package visual harness case for the page-segment panel using metadata fixture page data. Verify selected/unselected controls, available choices, action visibility, and message state.

## Validation

Run from `aurorra_index`:

1. `npm run typecheck`
2. `npm run lint:boundary`
3. `npm run test:vitest`
4. `npm run test:visual`
5. `npm run build`

Run the focused page-segment and metadata action tests while implementing, then run the full commands above before completion.

## Grep Gates

Run after implementation:

1. `rg -n "EventBus|EVENTS|globalThis|WorkerHelper|document_web|pagesegmentsdialog" src/features/metdataview src/features/pagesegments`
2. `rg -n "reFinePage|PageSegmentsDialog" document_web/src/domains/refine document_web/src/domains/shared/viewer`
3. `rg -n "[ \t]+$" src/features/metdataview src/features/pagesegments docs/tasks/metadata-refinement-plan.md`

Expected results:

- Gate 1 has no matches.
- Gate 2 has no active page-segment legacy path matches.
- Gate 3 has no matches.

## Index Change Queue

Add, edit, delete, and confirm use `queueStoreApi.enqueue`. Generated chat changes arrive as an opaque JSON string via the host. The queue validates the complete request, applies it to the shared local metadata cache, and returns `{ status: "accepted" }`. One worker processes tasks and their changes sequentially. Metadata reloads preserve outstanding local changes.

The queue retains failed tasks for retry or cancel. Failure removes one task from the open count without recording a completion; retry reopens it. Cancel removes the unprocessed local change. Completed operations are retained when retrying a partially processed task.

The exported `QueueNotice[]` carries generic queue ID, session, batch, pending count, failed count, and completed count. The host checks each panel's `queueAware` configuration. Enabled headers show a pending-content tooltip for relevant open tasks. Successful completion changes the refresh button color; reports refresh on user request. Title reports match the report's batch; session panels match their current session.

The queue header indicator is a non-clickable stopwatch, shown only while relevant tasks remain open. Its tooltip explains pending content and the refresh highlight after success. Failed items show their error and Retry/Cancel directly; the queue dialog is removed. Successful completion highlights refresh button backgrounds and supplies a refresh explanation tooltip.

Pending add, edit, page, and confirm rows remain visible and disabled with a light green left border. Pending deletions remain visible and disabled with a red left border until success. Shared core `ConfButton` requires a second click for row confirm/delete and shows an armed outline and an expiring progress bar without numeric seconds. Pending item content and ordinary controls are gray and inert; recovery controls remain interactive. No pending-text badge is rendered. Cancel removes an uncommitted addition, retains an uncommitted deletion, restores the ambiguity flag for an uncommitted confirmation, and restores prior values for an uncommitted edit. Cancellation targets the selected item within a task.
