# IQ Pure React Implementation Contract

## Non-Negotiable Target
Move `document_web\src\domains\iq` into `aurorra_index` as a full package-owned pure React feature.

`aurorra_index` owns:
- IQ worker requests.
- IQ response parsing.
- IQ normalization.
- IQ Zustand state.
- IQ gate acknowledgment.
- IQ refresh.
- IQ body-panel rendering.
- IQ package tests and visual tests.

`document_web` owns:
- App shell placement only.
- Mounting the exported `IqPanel` into the existing preview host for desktop.
- Mounting the exported `IqPanel` into the existing dialog body host for tablet and kiosk.
- App alert display from package callbacks.
- Existing layout type updates.

Spark must not make implementation decisions. If an implementation detail is not defined in this contract or in the referenced current source files, Spark must stop and report the exact missing file/function/behavior.

## Source Files Reviewed
- `document_web\src\domains\iq\api\iqWorker.js`
- `document_web\src\domains\iq\svc\iq_service.js`
- `document_web\src\domains\iq\data\iqngatedatahelper.js`
- `document_web\src\domains\iq\shell\iqviewer.js`
- `document_web\src\domains\workflow\svc\orchestrator.js`
- `document_web\src\bootstrap\app-imports.ts`
- `document_web\src\domains\shared\utils\worker\workerhelper.js`
- `aurorra_index\src\features\metdata\worker\IndexWorker.ts`
- `aurorra_index\src\features\metdata\worker\indexWorkerClient.ts`
- `aurorra_index\src\features\metdata\hook\useMetadata.ts`
- `aurorra_index\src\features\metdata\store\indexStore.ts`
- `aurorra_index\src\features\indexing\component\IndexProgress.tsx`
- `aurorra_index\src\features\legalplat\component\LegalPlatContent.tsx`
- `aurorra_index\src\features\legalplat\component\LegalPlatDialog.tsx`
- `aurorra_index\src\features\addressmap\component\AddressMapContent.tsx`
- `aurorra_index\src\features\addressmap\component\AddressMapDialog.tsx`
- `aurorra_index\scripts\check-boundary.cjs`
- `C:\GitHub\Tabularium\user_svc\doc\rout_iq.md`

## Backend Contract
Use the same base URL input as metadata: `apiGatewayUrl`.

Build these exact routes in `aurorra_index\src\features\iq\worker\IqWorker.ts`:
- `GET ${apiBaseUrl}/v1/iq/${encodeURIComponent(session)}/data`
- `POST ${apiBaseUrl}/v1/iq/${encodeURIComponent(session)}/start`
- `POST ${apiBaseUrl}/v1/iq/${encodeURIComponent(session)}/gates/${encodeURIComponent(code)}/ack`

Request rules:
- Strip trailing slashes from `apiBaseUrl` before building URLs.
- Send `Authorization: Bearer ${token}` for every request.
- Send no request body for `iqData`.
- Send `JSON.stringify({})` for `iqStart`.
- Send no request body for `iqAck`.
- Use `method: "GET"` for `iqData`.
- Use `method: "POST"` for `iqStart` and `iqAck`.

Input validation:
- Missing `token` returns `{ ok: false, code: "missing_auth_token", error: "Missing auth token" }`.
- Missing `apiBaseUrl` returns `{ ok: false, code: "missing_api_base_url", error: "Missing service base URL" }`.
- Non-string or blank `session` returns `{ ok: false, code: "invalid_session", error: "Session is missing or invalid." }`.
- `iqAck` with non-string or blank `code` returns `{ ok: false, code: "invalid_gate_code", error: "Gate code is missing or invalid." }`.
- Unknown command type returns `{ ok: false, code: "invalid_command", error: "Unknown IQ worker command." }`.

Response parsing:
- Read `response.headers.get("content-type")`.
- Read `await response.text()`.
- If text exists and content type includes `application/json`, parse JSON.
- If JSON parsing fails, return `{ ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: response.status }`.
- If `response.ok` and content type is not JSON, return `{ ok: false, code: "non_json_response", error: "Response is not JSON.", status: response.status }`.
- If `response.ok` is false and payload is an object, use `payload.error` first, then `payload.message`, then `HTTP ${response.status}`.
- If `response.ok` is false and payload is a non-empty string, use the trimmed string as `error`.
- Preserve object payloads as `details`.

IQ data success:
- If payload has `status: "error"`, return `{ ok: false, code: "iq_error", details: payload, error: String(payload.data || payload.error || "error") }`.
- If payload has `data` as a string, parse `data` as JSON and validate as `IqReport`.
- If payload is already an IQ report object, validate it directly.
- Return `{ ok: true, data: report }` after validation.

IQ start success:
- Return `{ ok: true, data: { status, data, isComplete } }`.
- `isComplete` is `true` only when `payload.status === "completed"`.

IQ ack success:
- Return `{ ok: true, data: { status, data, isComplete: true } }`.

## Package Files To Create
Create exactly these production files:
- `aurorra_index\src\features\iq\component\IqPanel.tsx`
- `aurorra_index\src\features\iq\component\IqSummary.tsx`
- `aurorra_index\src\features\iq\component\IqSegments.tsx`
- `aurorra_index\src\features\iq\component\IqGates.tsx`
- `aurorra_index\src\features\iq\data\iqData.ts`
- `aurorra_index\src\features\iq\hook\useIqReport.ts`
- `aurorra_index\src\features\iq\store\iqStore.ts`
- `aurorra_index\src\features\iq\style\iqStyles.ts`
- `aurorra_index\src\features\iq\type\iq.types.ts`
- `aurorra_index\src\features\iq\worker\IqWorker.ts`
- `aurorra_index\src\features\iq\worker\iqWorkerClient.ts`
- `aurorra_index\src\features\iq\index.ts`

Update exactly these existing package files:
- `aurorra_index\src\index.tsx`
- `aurorra_index\tests\visual\index.html`
- `aurorra_index\tests\visual\addressmap.visual-entry.js`
- `aurorra_index\vite.visual.config.ts`

Do not create `aurorra_index\tests\visual\iq.visual-entry.js`. Use the existing `addressmap.visual-entry.js` scenario router.

Do not create a controller file, service file, adapter file, provider file, class-based viewer file, compatibility file, alias file, or bridge file inside `aurorra_index\src\features\iq`.

## Exact Type Definitions
Create these exports in `iq.types.ts`.

```ts
export type IqGateStatus = "PASS" | "FAIL" | "WARNING" | "INFO";
export type IqUiStatus = "success" | "fail" | "warning" | "info";
export type IqDecision = "Pass" | "Review" | "Reject";
export type IqBucket = "green" | "amber" | "red";
export type IqStatus = "idle" | "loading" | "refreshing" | "success" | "error";

export type IqGate = {
  code: string;
  status: IqGateStatus | string;
  description: string;
};

export type IqSegment = {
  segment_name: string;
  expected_weight: number;
  actual_weight: number;
  iq: number;
  explanations: string[];
};

export type IqReport = {
  iq_doc: number;
  decision: IqDecision | string;
  gates: IqGate[];
  segments: IqSegment[];
  explanation: string[];
};

export type IqGateView = {
  code: string;
  status: IqUiStatus;
  description: string;
  isFailure: boolean;
};

export type IqSegmentView = {
  id: string;
  displayId: string;
  expectedWeight: number;
  expectedDisplay: string;
  actualWeight: number;
  actualDisplay: string;
  iq: number;
  iqDisplay: string;
  explanations: string[];
};

export type IqReportView = {
  iq: {
    value: number;
    displayInt: number;
    bucket: IqBucket;
    decision: IqDecision;
  };
  gates: {
    items: IqGateView[];
    total: number;
    success: number;
    ratio: number;
    displayPercent: number;
    bucket: IqBucket;
    decision: IqDecision;
  };
  segments: IqSegmentView[];
  explanations: string[];
};

export type IqWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type IqWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & IqWorkerError);

export type IqWorkerCommand =
  | { apiBaseUrl: string; session: string; token: string; type: "iqData" }
  | { apiBaseUrl: string; session: string; token: string; type: "iqStart" }
  | { apiBaseUrl: string; code: string; session: string; token: string; type: "iqAck" };

export type IqWorkerConfig = {
  apiBaseUrl: string;
};

export type IqStartResult = {
  data: unknown;
  isComplete: boolean;
  status: string;
};

export type IqAckResult = {
  data: unknown;
  isComplete: true;
  status: string;
};

export type IqWorkerClient = {
  ackGate(token: string, session: string, code: string): Promise<IqAckResult>;
  loadReport(token: string, session: string): Promise<IqReport>;
  startReport(token: string, session: string): Promise<IqStartResult>;
};

export type IqCallbacks = {
  onIqAck?: (code: string) => void;
  onIqCanceled?: () => void;
  onIqError?: (error: IqWorkerError) => void;
  onIqLoaded?: (report: IqReport) => void;
  onIqRefresh?: (report: IqReport) => void;
  onIqStarted?: (result: IqStartResult) => void;
};

export type IqPanelProps = {
  apiGatewayUrl: string;
  authToken: string | null;
  callbacks: IqCallbacks;
  session: string;
  workerClient?: IqWorkerClient;
};

export type IqStoreState = {
  activeSession: string | null;
  ackingCodes: ReadonlySet<string>;
  error: IqWorkerError | null;
  report: IqReport | null;
  status: IqStatus;
  ackStart(code: string): void;
  ackSuccess(code: string): void;
  resetIq(): void;
  setError(error: IqWorkerError): void;
  setLoaded(session: string, report: IqReport): void;
  setLoading(session: string): void;
  setRefreshing(session: string): void;
};
```

Do not add extra exported types during implementation. Stop if an additional type appears necessary.

## Data Implementation Details
Create `iqData.ts` as pure functions only. Do not create a class.

Exports:
- `GATE_PASS = "PASS"`
- `GATE_FAIL = "FAIL"`
- `GATE_WARNING = "WARNING"`
- `GATE_INFO = "INFO"`
- `UI_PASS = "success"`
- `UI_FAIL = "fail"`
- `UI_WARNING = "warning"`
- `UI_INFO = "info"`
- `prepareIqReport(raw: unknown): IqReportView`
- `normalizeIqReport(raw: unknown): IqReport`

Function behavior must match `document_web\src\domains\iq\data\iqngatedatahelper.js`:
- Default `iq_doc` is `0`.
- Default `decision` is `"Review"`.
- Default `gates` is `[]`.
- Default `segments` is `[]`.
- Default `explanation` is `[]`.
- Valid decisions are `"Pass"`, `"Review"`, `"Reject"`.
- Invalid decision becomes `"Review"`.
- Numeric conversion uses `Number(value)` and returns `0` when not finite.
- Percentage values clamp to `0..100`.
- Bucket is `"green"` for `>= 96`.
- Bucket is `"amber"` for `>= 82` and `< 96`.
- Bucket is `"red"` for `< 82`.
- Display numbers use `.toFixed(2)`.
- `displayInt` uses `Math.round`.
- Segment display id replaces `_` and `-` with spaces, trims, lowercases, and title-cases first letters.
- Unknown gate statuses are filtered out.
- Gate status maps `PASS` to `success`, `FAIL` to `fail`, `WARNING` to `warning`, `INFO` to `info`.
- Gate `isFailure` is true only for raw `FAIL`.
- Gate success count includes every item where `isFailure === false`.
- Gate ratio is `(success / total) * 100`, or `0` when total is `0`.
- Gate display percent is `Math.round(clampPercent(ratio))`.
- Gate decision is `"Reject"` if any gate is failure.
- Gate decision is `"Pass"` if at least one success exists and no failure exists.
- Gate decision is `"Review"` otherwise.
- Segment explanation values are converted with `String`.
- Report explanation values are converted with `String`.

No `showExplanations` option is allowed in the package. The donor default is `true`, so explanations always render when present.

## Zustand Store Details
Create `iqStore.ts` using `zustand` and the same style as `aurorra_index\src\features\metdata\store\indexStore.ts`.

Initial state:
- `activeSession: null`
- `ackingCodes: new Set()`
- `error: null`
- `report: null`
- `status: "idle"`

State transitions:
- `setLoading(session)` sets `activeSession`, clears `error`, preserves `report`, sets `status: "loading"`.
- `setRefreshing(session)` sets `activeSession`, clears `error`, preserves `report`, sets `status: "refreshing"`.
- `setLoaded(session, report)` sets `activeSession`, clears `error`, sets `report`, sets `status: "success"`.
- `setError(error)` sets `error`, sets `status: "error"`, preserves `report`.
- `ackStart(code)` adds `code` to `ackingCodes`.
- `ackSuccess(code)` removes `code` from `ackingCodes` and removes the gate with matching `code` from `report.gates` when `report` exists.
- `resetIq()` restores the initial state.

Export:
- `useIqStore`
- `iqStoreApi`

Do not persist IQ report in the shared metadata store. Do not add IQ keys to `storeApi`.

## Worker Client Details
Create `iqWorkerClient.ts` using the metadata worker client pattern.

Implementation rules:
- Use `new Worker(new URL("./IqWorker.ts", import.meta.url), { type: "module" })`.
- Terminate the worker after the first message or error.
- Resolve when payload has `ok === true`.
- Reject with an `Error` object when payload has `ok !== true`.
- Attach `code`, `details`, and `status` to the rejected error when present.

Export:
- `createIqWorkerClient(config: IqWorkerConfig): IqWorkerClient`

Returned methods:
- `loadReport(token, session)` posts `{ apiBaseUrl, session, token, type: "iqData" }`.
- `startReport(token, session)` posts `{ apiBaseUrl, session, token, type: "iqStart" }`.
- `ackGate(token, session, code)` posts `{ apiBaseUrl, code, session, token, type: "iqAck" }`.

## Hook Details
Create `useIqReport.ts`.

Inputs:
- `apiGatewayUrl`
- `authToken`
- `callbacks`
- `session`
- `workerClient`

Implementation:
- Store `callbacks` in a ref and update it in an effect.
- Create client with `workerClient || createIqWorkerClient({ apiBaseUrl: apiGatewayUrl })`.
- On mount and whenever `session`, `authToken`, `apiGatewayUrl`, or `workerClient` changes, call `loadReport(false)`.
- On unmount, call `callbacksRef.current.onIqCanceled?.()`.
- `loadReport(refresh: boolean)` sets `setRefreshing(session)` when `refresh` is true, otherwise `setLoading(session)`.
- `loadReport` calls `client.loadReport(authToken ?? "", session)`.
- On success, call `setLoaded(session, report)`, `onIqLoaded(report)`, and `onIqRefresh(report)` only when `refresh` is true.
- On error, normalize to `{ code, details, error, status }`, call `setError`, then `onIqError`.
- `startReport()` calls `client.startReport(authToken ?? "", session)`.
- On start success, call `onIqStarted(result)`.
- On start error, normalize and call `setError` and `onIqError`.
- `ackGate(code)` calls `ackStart(code)`, then `client.ackGate(authToken ?? "", session, code)`.
- On ack success, call `ackSuccess(code)` and `onIqAck(code)`.
- On ack error, normalize and call `setError` and `onIqError`.

Return:
- `ackingCodes`
- `error`
- `loadReport`
- `report`
- `startReport`
- `ackGate`
- `status`
- `view`

`view` is `prepareIqReport(report)` when `report` exists, otherwise `null`.

## React Component Details
Create `IqPanel.tsx`.

Component tree:
- Root: `<section aria-label="Indexing Quality" style={iqStyles.root}>`
- Loading overlay: use `aurorra-ui/ProgressBar` through the existing package dependency when `status` is `"loading"` or `"refreshing"`.
- If status is `"error"` and `report` is null, render `null`.
- If `view` is null, render a package empty message: `No IQ report found.`
- Render `IqSummary`.
- Render divider.
- Render heading text `Indexing Segments (${view.segments.length})`.
- Render `IqSegments`.
- Render `IqGates`.
- Render notes only when `view.explanations.length > 0`.

Create `IqSummary.tsx`.
- Props: `{ iq: IqReportView["iq"] }`.
- Render the IQ metric card from donor behavior:
  - Large number `${iq.displayInt}%`.
  - Subtext `out of 100`.
  - Label `Indexing Quality (IQ)`.
  - Horizontal bar width `${iq.value}%`.
  - Palette:
    - green: fg `#065f46`, bar `#16a34a`
    - amber: fg `#92400e`, bar `#f59e0b`
    - red: fg `#991b1b`, bar `#ef4444`

Create `IqSegments.tsx`.
- Props: `{ segments: IqSegmentView[] }`.
- Render a table.
- Headers exactly: `Segment`, `Expected`, `Actual`, `IQ`.
- Use `segment.displayId`, `expectedDisplay`, `actualDisplay`, `iqDisplay`.
- Render segment explanations below the table.
- Explanation header format exactly: `Segment: ${segment.displayId}`.
- Render explanation items in a `ul`.

Create `IqGates.tsx`.
- Props: `{ ackingCodes: ReadonlySet<string>; gates: IqReportView["gates"]; onAck: (code: string) => void }`.
- Render gate metric card from donor behavior:
  - Large number `${gates.displayPercent}%`.
  - Subtext `out of ${gates.total} gates`.
  - Label `Compliance Gates`.
  - Horizontal bar width `${gates.displayPercent}%`.
  - Same bucket palette as `IqSummary`.
- Render heading exactly: `Compliance Gates (${gates.items.length})`.
- Render `None` when there are no gates.
- Gate row layout must keep three columns: status, description, action.
- Status display:
  - `success` displays `PASS`.
  - Other statuses display uppercase UI status.
- Status colors:
  - success: bg `#10b981`, border `#065f46`
  - warning: bg `#fcd34d`, border `#d97706`
  - info: bg `#94a3b8`, border `#475569`
  - fail: bg `#ef4444`, border `#991b1b`
- Render clear action only for `fail` and `warning`.
- Use `ConfButton` from `aurorra-ui` for the clear action because current package rows already use `ConfButton` for confirmation behavior.
- Use Radix Tooltip around the clear action with text `Clear gate`.
- Clear action label must be `Clear gate`.
- Clear action calls `onAck(gate.code)`.
- Disable clear action when `ackingCodes.has(gate.code)`.
- Set `data-gate-code={gate.code}` on each gate row.

No component may use class components, `document.createElement`, `appendChild`, `innerHTML`, direct DOM queries, or host element mutation.

## Style Details
Create `iqStyles.ts`.

Use style-object exports only. No CSS file.

Required style keys:
- `root`
- `progressOverlay`
- `summaryCard`
- `metricNumber`
- `metricSubtext`
- `metricLabel`
- `metricTrack`
- `metricFill(bucket: IqBucket, width: number)`
- `divider`
- `sectionTitle`
- `segmentTable`
- `segmentHeaderCell(align: "left" | "right")`
- `segmentCell(align: "left" | "right", strong?: boolean)`
- `explanationBlock`
- `explanationTitle`
- `explanationList`
- `gateList`
- `gateRow`
- `gateStatus`
- `gateFlag(status: IqUiStatus)`
- `gateText`
- `gateAction`
- `empty`
- `notesTitle`
- `notesList`

Use donor colors and spacing from `iqviewer.js`. Do not introduce a new visual design.

## Package Exports
Update `aurorra_index\src\features\iq\index.ts` to export:
- `IqPanel`
- `useIqReport`
- `createIqWorkerClient`
- `iqStoreApi`
- `useIqStore`
- `prepareIqReport`
- `normalizeIqReport`
- All IQ constants from `iqData.ts`
- All types from `iq.types.ts`

Update `aurorra_index\src\index.tsx` with the same IQ exports.

Do not export:
- `IQController`
- `IQView`
- `IQAdapter`
- `IqViewer`
- `IqViewerFrame`
- `IqViewerContent`
- `IqProvider`

## Test Implementation Details
Create exactly these package tests:
- `aurorra_index\src\features\iq\test\iqData.vitest.test.ts`
- `aurorra_index\src\features\iq\test\IqWorker.vitest.test.ts`
- `aurorra_index\src\features\iq\test\iqStore.vitest.test.ts`
- `aurorra_index\src\features\iq\test\useIqReport.vitest.test.tsx`
- `aurorra_index\src\features\iq\test\IqPanel.vitest.test.tsx`
- `aurorra_index\src\features\iq\test\IqGates.vitest.test.tsx`

`iqData.vitest.test.ts` must cover:
- `iq_doc: 90` produces `displayInt: 90`, `bucket: "amber"`.
- `iq_doc: 97` produces `bucket: "green"`.
- `iq_doc: 81` produces `bucket: "red"`.
- Negative IQ clamps to `0`.
- IQ above `100` clamps to `100`.
- Mixed PASS/FAIL gates produce `displayPercent: 50` and `decision: "Reject"`.
- PASS-only gates produce `decision: "Pass"`.
- WARNING-only gates produce `decision: "Review"`.
- Unknown gate statuses are filtered.
- Segment name `party_clause` displays `Party Clause`.
- Invalid decision normalizes to `"Review"`.

`IqWorker.vitest.test.ts` must cover:
- Data route builds `https://doc.example.com/v1/iq/session-1/data`.
- Start route builds `https://doc.example.com/v1/iq/session-1/start`.
- Ack route builds `https://doc.example.com/v1/iq/session-1/gates/gate-abc/ack`.
- Session and code are encoded with `encodeURIComponent`.
- Bearer auth header is sent.
- Missing token, missing base URL, blank session, blank ack code, and invalid command return the exact errors in this contract.
- Network error returns error message.
- Non-JSON success response returns `non_json_response`.
- Invalid JSON returns `invalid_json`.
- HTTP error object preserves `code`, `details`, `error`, and `status`.
- IQ data envelope with `status: "error"` returns `iq_error`.
- IQ data envelope with JSON string `data` returns parsed report.

`iqStore.vitest.test.ts` must cover every state transition defined in this contract.

`useIqReport.vitest.test.tsx` must cover:
- Initial load calls `loadReport`.
- Successful load updates store and calls `onIqLoaded`.
- Refresh calls `onIqRefresh`.
- Start calls `onIqStarted`.
- Ack calls `ackGate`, removes gate from store, and calls `onIqAck`.
- Error calls `onIqError`.
- Unmount calls `onIqCanceled`.

`IqPanel.vitest.test.tsx` must cover:
- Loading progress renders.
- Empty state renders `No IQ report found.`
- IQ summary renders metric and bar.
- Segment table renders all four headers.
- Segment explanations render.
- Notes render only when present.
- No `dialog` role is rendered by `IqPanel`.

`IqGates.vitest.test.tsx` must cover:
- Gate metric renders `50%` and `out of 2 gates`.
- PASS gate has no clear action.
- FAIL gate has clear action.
- WARNING gate has clear action.
- Clear action calls `onAck`.
- Acking code disables clear action.
- Empty gates render `None`.

## Live Code Delta Notes
The repo state after implementation is not identical to the original contract. Keep these deltas in view when revising or validating the work:
- `document_web\src\features\iq\component\IqHost.tsx` still owns tablet and kiosk presentation with `aurorra-ui/Dialog`, a custom header, and `resetParam("layout_type")`.
- `document_web\src\app\shell\component\AppShell.tsx` still renders `<dialog id="dialog-container" ... />` without the `open={...}` expression described later in this contract.
- `document_web\src\domains\workflow\svc\orchestrator.js` no longer contains `await IQController.showReport(layoutMode);`; current IQ routing only sets `layout_type` to `IQREPORT`.
- `document_web\src\features\iq\legacy\iqRuntime.ts` still uses `EventBus`, `EVENTS`, `ENV`, and `AlertHelper` for the adapter error path.
- `aurorra_index\tests\visual\iq.visual.tsx` and `aurorra_index\tests\visual\iq.visual.spec.ts` already include stronger visual assertions than the minimum contract, including gate-removal flow and zero-dialog checks.
- `aurorra_index\src\features\iq\component\IqGates.tsx` currently uses `ConfButton` and tooltip affordances for clear actions.

## Visual Test Details
Create:
- `aurorra_index\tests\visual\iq.visual.tsx`
- `aurorra_index\tests\visual\iq.visual.spec.ts`

Update:
- `aurorra_index\tests\visual\addressmap.visual-entry.js`
- `aurorra_index\tests\visual\index.html`
- `aurorra_index\vite.visual.config.ts`

Exact visual entry update:
- In `addressmap.visual-entry.js`, add `else if (scenario === "iq") { await import("./iq.visual.tsx"); }` between the existing `legal-gap` branch and the default addressmap branch.
- Do not change the default scenario; it must keep importing `./addressmap.visual.tsx`.

Exact visual Vite update:
- Add alias key `"@radix-ui/react-tooltip": path.resolve(rootDir, "node_modules/@radix-ui/react-tooltip")`.
- Add `"@radix-ui/react-tooltip"` to `dedupe`.
- Keep existing aliases for React, ReactDOM, Radix dialog, Radix progress, and `aurorra-ui`.

Exact visual spec navigation:
- `iq.visual.spec.ts` must use `await page.goto("/?scenario=iq");`.

Visual harness:
- Render `IqPanel` with a worker test double.
- Fixture report contains:
  - `iq_doc: 90`
  - one PASS gate
  - one FAIL gate
  - one segment named `party_clause`
  - one report explanation
- Browser test must verify:
  - `Indexing Quality (IQ)` is visible.
  - `90%` is visible.
  - `Indexing Segments (1)` is visible.
  - `Party Clause` is visible.
  - `Compliance Gates (2)` is visible.
  - FAIL gate clear action is visible.
  - Clicking clear removes the FAIL gate.
  - The panel has no dialog role.

## `document_web` Adapter Implementation Details
After package tests pass, update `document_web`.

Create no IQ logic in `document_web`. Only mount package UI.

Production edits:
- Create `document_web\src\features\iq\legacy\iqRuntime.ts`.
- Create `document_web\src\features\iq\component\IqHost.tsx`.
- Create `document_web\src\features\iq\test\IqHost.vitest.test.tsx`.
- Create `document_web\src\features\iq\test\iqRuntime.vitest.test.ts`.
- Remove IQ legacy imports from `document_web\src\bootstrap\app-imports.ts`:
  - `../domains/iq/data/iqngatedatahelper.js`
  - `../domains/iq/shell/iqviewer.js`
  - `../domains/iq/svc/iq_service.js`
- Leave `../domains/iq/api/iqWorker.js` unused and then remove it only after no import references remain.
- Update `document_web\src\domains\workflow\svc\orchestrator.js` so `onShowIQReport` no longer calls `IQController.showReport(layoutMode)`.
- Use the same layout flow already present in `onShowIQReport`: read `layoutMode`, preserve the studio-mode duplicate-view shake behavior, mount IQ, then set layout type to `IQREPORT`.
- Update `document_web\src\app\shell\component\AppShell.tsx` to import `IqHost` from `../../../features/iq/component/IqHost` and render `<IqHost />` inside the returned fragment after `<dialog id="dialog-container" role="region" aria-label="Dialog Container" />`.
- The mounting path must pass these props to `IqPanel`:
  - `session` from `globalThis.store.get(globalThis.store.PARAMS.session)`
  - `apiGatewayUrl` from `ENV.user_service_url`, matching `document_web\src\features\index\legacy\indexRuntime.ts`
  - `authToken` from the same auth/token source used by the current metadata package adapter in this repo
  - `callbacks.onIqError` that emits the existing app alert
- Reuse `resolveIndexAuthToken` from `document_web\src\features\index\legacy\indexRuntime.ts` for token extraction. Do not duplicate token parsing.

Exact `iqRuntime.ts` exports:
- `resolveIqProps(userToken: unknown, state: IqRuntimeState): IqPanelProps | null`
- `iqCallbacks: IqCallbacks`
- `showIqError(error: unknown): void`

Exact `IqRuntimeState` shape:
- Create `document_web\src\features\iq\type\iq.types.ts`.
- Export `IqRuntimeState` with fields:
  - `layoutMode: unknown`
  - `layoutType: unknown`
  - `session: unknown`

Exact `resolveIqProps` behavior:
- Return `null` unless `state.layoutType === PARAMS.layout_type.values.IQREPORT`.
- Return `null` unless `state.session` is a non-empty string.
- Use `resolveIndexAuthToken(userToken)` for `authToken`.
- Return `null` when auth token is missing.
- Return `{ authToken, apiGatewayUrl: ENV.user_service_url, callbacks: iqCallbacks, session }`.

Exact `iqCallbacks` behavior:
- `onIqError(error)` calls `showIqError(error)`.
- `onIqLoaded`, `onIqRefresh`, `onIqStarted`, `onIqAck`, and `onIqCanceled` are not defined. Do not add no-op callbacks.
- `showIqError(error)` must use the same error formatting order as `resolveErrorMessage` in `document_web\src\features\index\legacy\indexRuntime.ts`, then emit `EventBus.emit(EVENTS.showAlert, { message })`.

Host placement:
- `IqHost` must read `userToken`, `layout_mode`, `layout_type`, and `session` from `useAppStore`.
- `IqHost` must call `resolveIqProps(userToken, { layoutMode: layout_mode, layoutType: layout_type, session })`.
- `IqHost` returns `null` when `resolveIqProps` returns `null`.
- `IqHost` uses `createPortal` from `react-dom`.
- When `layout_mode === PARAMS.layout_mode.values.STUDIOMODE`, portal `<IqPanel {...props} />` into `document.getElementById("preview-container")`.
- When `layout_mode === PARAMS.layout_mode.values.TABLETMODE`, portal `<IqPanel {...props} />` into `document.getElementById("dialog-container")`.
- When `layout_mode === PARAMS.layout_mode.values.KIOSKMODE`, portal `<IqPanel {...props} />` into `document.getElementById("dialog-container")`.
- When the target element is missing, return `null`.
- In dialog placement, `IqHost` must set the `open` attribute on `dialog-container` through React by updating `AppShell`, not by imperative DOM mutation in `IqHost`.
- Update `AppShell.tsx` so the dialog element is `<dialog id="dialog-container" role="region" aria-label="Dialog Container" open={layout_type === LAYOUT_TYPE_VALUES.IQREPORT && layout_mode !== LAYOUT_MODE_VALUES.STUDIOMODE} />`.
- Import `LAYOUT_MODE_VALUES` and `LAYOUT_TYPE_VALUES` from `../../store/type/paramRegistry` in `AppShell.tsx` for the dialog `open` expression.
- `aurorra_index` must receive no `layoutMode` prop.
- `IqPanel` must not import, create, or close the host dialog.

Exact orchestrator update:
- Delete the line `await IQController.showReport(layoutMode);`.
- Do not replace it with another function call.
- `IqHost` must render from `layout_type` after `globalThis.store.set(globalThis.store.PARAMS.layout_type, globalThis.store.PARAMS.layout_type.values.IQREPORT)`.
- Do not add a new global controller.
- Do not add a new EventBus event.
- Do not import React or `aurorra-index` into `orchestrator.js`.

## Legacy Files After Cutover
After the new package path and adapter tests pass, these files must have no active imports:
- `document_web\src\domains\iq\api\iqWorker.js`
- `document_web\src\domains\iq\svc\iq_service.js`
- `document_web\src\domains\iq\data\iqngatedatahelper.js`
- `document_web\src\domains\iq\shell\iqviewer.js`

Delete the old IQ files only in the same implementation pass that removes their imports and replaces their tests. Do not leave dead files.

## Existing Donor Tests To Port Or Replace
Port behavior from:
- `document_web\src\domains\iq\api\tests\iqworker-routes.unit.test.js`
- `document_web\src\domains\iq\data\tests\iqngatedata-gates-percent.unit.test.js`
- `document_web\src\domains\iq\shell\test\iqviewer-gates-render.unit.test.js`
- `document_web\src\domains\iq\svc\tests\iqadapter-contract.unit.test.js`
- `document_web\src\domains\iq\svc\tests\iqservice-controller.unit.test.js`
- `document_web\src\domains\iq\svc\tests\iqservice-domain.unit.test.js`

Delete these loader-order tests after bootstrap imports are removed:
- `document_web\src\domains\iq\svc\tests\iq-loader.unit.test.js`
- `document_web\src\domains\iq\data\tests\iqngatedata-loader.unit.test.js`

## Boundary Rules
`aurorra_index\src\features\iq` must contain none of these strings:
- `globalThis`
- `UI`
- `EventBus`
- `EVENTS`
- `ENV`
- `API`
- `WorkerHelper`
- `AlertHelper`
- `ALERT_MESSAGES`
- `document_web`
- `IQController`
- `IQView`
- `IQAdapter`
- `IqViewer`
- `document.createElement`
- `appendChild`
- `innerHTML`

Do not weaken `aurorra_index\scripts\check-boundary.cjs`.

## Verification Commands
Run from `aurorra_index`:
1. `npm run typecheck`
2. `npm run lint:boundary`
3. `npm run test:vitest`
4. `npm run test:visual`
5. `npm run build`

Run from `document_web`:
1. `npm run test`
2. `npm run typecheck`
3. `npm run build`
4. `npm run test:visual`
5. Browser verification for IQ preview placement.
6. Browser verification for IQ dialog placement.

Grep gates:
1. `rg -n "globalThis|\\bUI\\b|EventBus|\\bEVENTS\\b|\\bENV\\b|\\bAPI\\b|WorkerHelper|AlertHelper|ALERT_MESSAGES|document_web|IQController|IQView|IQAdapter|IqViewer|document\\.createElement|appendChild|innerHTML" aurorra_index/src/features/iq`
2. `rg -n "[ \\t]+$" aurorra_index/src/features/iq aurorra_index/docs/tasks/iq-refactor-plan.md`
3. `rg -n "domains/iq/(data|shell|svc)|IQController|IqViewer|iqngatedatahelper" document_web/src/bootstrap document_web/src/domains/workflow`

The first grep command must return no matches. The second grep command must return no matches. The third grep command must return no matches after `document_web` cutover.

## Hard Stops
Stop if:
- Spark needs to choose a file name not listed in this contract.
- Spark needs to add a prop not listed in this contract.
- Spark needs to export a type not listed in this contract.
- Spark needs to add a state field not listed in this contract.
- Spark needs to choose dialog or preview placement inside `aurorra_index`.
- Spark needs to preserve an IQ controller, adapter, service, viewer class, or global export.
- Backend IQ response shape differs from `rout_iq.md` and the current donor worker tests.
- Visual behavior cannot be verified in browser.
- Any verification command fails for a reason caused by the IQ transfer.
