# Audit Pure React Implementation Contract

## Non-Negotiable Target
Move `document_web\src\domains\audit` into `aurorra_index` as a full package-owned pure React feature.

`aurorra_index` owns:
- Audit worker requests.
- Audit response parsing.
- Audit normalization.
- Audit Zustand state.
- Audit filtering and gap rendering.
- Audit package tests and visual tests.

`document_web` owns:
- App shell placement only.
- Mounting the exported `AuditPanel` into the existing preview host for desktop.
- Rendering the exported `AuditPanel` inside the existing `aurorra-ui` `Dialog` pattern for tablet and kiosk.
- App alert display from package callbacks.
- Existing layout type updates.

Spark must not make implementation decisions. If an implementation detail is not defined in this contract or in the referenced current source files, Spark must stop and report the exact missing file/function/behavior.

## Source Files Reviewed
- `document_web\src\domains\audit\api\todo.md`
- `document_web\src\domains\audit\data\auditdatahelper.js`
- `document_web\src\domains\audit\shell\auditviewer.js`
- `document_web\src\domains\audit\svc\audit_service.js`
- `document_web\src\domains\workflow\svc\orchestrator.js`
- `document_web\src\bootstrap\app-imports.ts`
- `document_web\src\bootstrap\events\eventBus.js`
- `document_web\src\domains\shared\utils\worker\workerhelper.js`
- `document_web\src\app\shell\component\AppShell.tsx`
- `document_web\src\app\store\type\paramRegistry.ts`
- `document_web\src\features\index\legacy\indexRuntime.ts`
- `document_web\src\domains\workflow\tests\orchestrator-refresh-audit.unit.test.js`
- `aurorra_index\src\features\metdata\worker\IndexWorker.ts`
- `aurorra_index\src\features\metdata\worker\indexWorkerClient.ts`
- `aurorra_index\src\features\metdata\hook\useMetadata.ts`
- `aurorra_index\src\features\metdata\store\indexStore.ts`
- `aurorra_index\src\features\addressmap\component\AddressMapContent.tsx`
- `aurorra_index\src\features\legalplat\component\LegalPlatContent.tsx`
- `aurorra_index\src\features\iq\component\IqPanel.tsx`
- `aurorra_index\src\features\iq\data\iqData.ts`
- `aurorra_index\src\features\iq\hook\useIqReport.ts`
- `aurorra_index\src\features\iq\store\iqStore.ts`
- `aurorra_index\src\features\iq\worker\IqWorker.ts`
- `aurorra_index\tests\visual\addressmap.visual-entry.js`
- `C:\GitHub\Tabularium\user_svc\doc\rout_index_data_api.md`

## Live Code Delta Notes
The repo state after implementation is not identical to the current audit controller stack. Keep these deltas in view when revising or validating the work:
- `document_web\src\domains\audit\svc\audit_service.js` still combines adapter, view, and controller behavior in one file.
- `document_web\src\domains\audit\shell\auditviewer.js` still mutates the DOM directly and uses `Dialog`, `document.createElement`, `appendChild`, and `innerHTML`.
- `document_web\src\domains\workflow\svc\orchestrator.js` still calls `AuditController.showReport(layoutMode)` in `onShowAuditReport`, and `onRefineSegmentComplete` still drives audit refresh.
- `document_web\src\bootstrap\app-imports.ts` still imports the legacy audit helper, viewer, and service files.
- `document_web\src\domains\audit\api\todo.md` is a stale stub and should be replaced by the real package contract.
- `aurorra_index` currently has no `audit` feature surface.

## Backend Contract
Use the same base URL input as metadata: `apiGatewayUrl`.

Build this exact route in `aurorra_index\src\features\audit\worker\AuditWorker.ts`:
- `GET ${apiBaseUrl}/v1/index/${encodeURIComponent(session)}/audit`

Request rules:
- Strip trailing slashes from `apiBaseUrl` before building the URL.
- Send `Authorization: Bearer ${token}` for every request.
- Send no request body.
- Use `method: "GET"`.

Input validation:
- Missing `token` returns `{ ok: false, code: "missing_auth_token", error: "Missing auth token" }`.
- Missing `apiBaseUrl` returns `{ ok: false, code: "missing_api_base_url", error: "Missing service base URL" }`.
- Non-string or blank `session` returns `{ ok: false, code: "invalid_session", error: "Session is missing or invalid." }`.
- Unknown command type returns `{ ok: false, code: "invalid_command", error: "Unknown audit worker command." }`.

Response parsing:
- Read `response.headers.get("content-type")`.
- Read `await response.text()`.
- If text exists and content type includes `application/json`, parse JSON.
- If JSON parsing fails, return `{ ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: response.status }`.
- If `response.ok` and content type is not JSON, return `{ ok: false, code: "non_json_response", error: "Response is not JSON.", status: response.status }`.
- If `response.ok` is false and payload is an object, use `payload.error` first, then `payload.message`, then `HTTP ${response.status}`.
- If `response.ok` is false and payload is a non-empty string, use the trimmed string as `error`.
- Preserve object payloads as `details`.

Audit data success:
- Parse the JSON body as the audit report.
- Normalize the report before returning it.
- Return `{ ok: true, data: report }` after `normalizeAuditReport` completes.

## Package Files To Create
Create exactly these production files:
- `aurorra_index\src\features\audit\component\AuditPanel.tsx`
- `aurorra_index\src\features\audit\component\AuditSummary.tsx`
- `aurorra_index\src\features\audit\component\AuditFilters.tsx`
- `aurorra_index\src\features\audit\component\AuditGaps.tsx`
- `aurorra_index\src\features\audit\data\auditData.ts`
- `aurorra_index\src\features\audit\hook\useAuditReport.ts`
- `aurorra_index\src\features\audit\store\auditStore.ts`
- `aurorra_index\src\features\audit\style\auditStyles.ts`
- `aurorra_index\src\features\audit\type\audit.types.ts`
- `aurorra_index\src\features\audit\worker\AuditWorker.ts`
- `aurorra_index\src\features\audit\worker\auditWorkerClient.ts`
- `aurorra_index\src\features\audit\index.ts`

Update exactly these existing package files:
- `aurorra_index\src\index.tsx`
- `aurorra_index\tests\visual\addressmap.visual-entry.js`

Do not create `aurorra_index\tests\visual\audit.visual-entry.js`. Use the existing `addressmap.visual-entry.js` scenario router.

Do not create a controller file, service file, adapter file, provider file, class-based viewer file, compatibility file, alias file, bridge file, or dialog file inside `aurorra_index\src\features\audit`.

## Exact Type Definitions
Create these exports in `audit.types.ts`.

```ts
export type AuditStatus = "idle" | "loading" | "refreshing" | "success" | "error";

export type AuditGap = {
  aspect: string;
  changeType: string;
  date: string;
  message: string;
  page: number | string;
  process: string;
};

export type AuditUsage = {
  costs: string[];
};

export type AuditReport = {
  gaps: AuditGap[];
  usage?: AuditUsage;
};

export type AuditFilters = {
  changeType: string;
  process: string;
};

export type AuditGapView = {
  aspect: string;
  aspectLabel: string;
  changeType: string;
  changeTypeLabel: string;
  date: string;
  dateLabel: string;
  message: string;
  page: number | string;
  process: string;
  processLabel: string;
};

export type AuditReportView = {
  changeCounts: {
    add: number;
    correction: number;
    other: number;
    remove: number;
  };
  filtered: number;
  gaps: AuditGapView[];
  processCounts: {
    enrichment: number;
    other: number;
    reprocess: number;
    user: number;
    verification: number;
  };
  total: number;
  usageCosts: string[];
};

export type AuditWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type AuditWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & AuditWorkerError);

export type AuditWorkerCommand =
  | { apiBaseUrl: string; session: string; token: string; type: "auditData" };

export type AuditWorkerConfig = {
  apiBaseUrl: string;
};

export type AuditWorkerClient = {
  loadReport(token: string, session: string): Promise<AuditReport>;
};

export type AuditCallbacks = {
  onAuditCanceled?: () => void;
  onAuditError?: (error: AuditWorkerError) => void;
  onAuditLoaded?: (report: AuditReport) => void;
};

export type AuditPanelProps = {
  apiGatewayUrl: string;
  authToken: string | null;
  callbacks: AuditCallbacks;
  session: string;
  workerClient?: AuditWorkerClient;
};

export type AuditStoreState = {
  activeSession: string | null;
  error: AuditWorkerError | null;
  report: AuditReport | null;
  status: AuditStatus;
  resetAudit(): void;
  setError(error: AuditWorkerError): void;
  setLoaded(session: string, report: AuditReport): void;
  setLoading(session: string): void;
  setRefreshing(session: string): void;
};
```

Do not add extra exported types during implementation.

## Data Implementation Details
Create `auditData.ts` as pure functions only. Do not create a class.

Exports:
- `CHANGE_ADD = "ADD"`
- `CHANGE_REMOVE = "REMOVE"`
- `CHANGE_CORRECTION = "CORRECTION"`
- `PROCESS_VERIFICATION = "VERIFICATION"`
- `PROCESS_ENRICHMENT = "ENRICHMENT"`
- `PROCESS_REPROCESS = "Reprocess |"`
- `PROCESS_USER = "USER"`
- `PROCESS_OTHER = "OTHER"`
- `normalizeAuditReport(raw): AuditReport`
- `prepareAuditReport(raw, filters): AuditReportView`

Function behavior must match `document_web\src\domains\audit\data\auditdatahelper.js` and `document_web\src\domains\audit\shell\auditviewer.js`:
- Default `gaps` is `[]`.
- Default `usage` is omitted.
- `usage.costs` is preserved only when `costs` is an array.
- `usage.costs` values are converted with `String`.
- Gaps may come in as arrays or objects.
- Array gaps use `[aspect, message, page, process, date, changeHint]`.
- Object gaps use the equivalent named fields.
- Non-object and non-array gap entries are discarded.
- Empty gaps with no aspect and no message are discarded.
- `aspect`, `message`, `process`, and `date` are converted with `String(...).trim()`.
- `page` uses `Number(value)` when finite, otherwise the trimmed string, otherwise `""`.
- Change type normalization maps `ADD` and `ADDITION` to `ADD`.
- Change type normalization maps `REMOVE` and `REMOVAL` to `REMOVE`.
- Change type normalization maps `UPDATE` and `CORRECTION` to `CORRECTION`.
- Unknown change types are uppercased and treated as `OTHER` for counts.
- Process normalization maps `indexing` and `verification` to `VERIFICATION`.
- Process normalization maps `correction`, `formatting`, and `enrichment` to `ENRICHMENT`.
- Process normalization maps `refinement` and `reprocess |` to `Reprocess |`.
- Process normalization maps `user` to `USER`.
- Any other process becomes `OTHER`.
- Gaps are sorted by date descending.
- When dates tie, sort by aspect ascending.
- When aspect also ties, sort by page ascending as a string.
- Date display uses `toLocaleString("en-US", { year, month, day, hour, minute, timeZoneName })` and falls back to `N/A`.
- Filtered list counts use both current filters.
- Change-type option counts are computed from rows that match the current `process` filter.
- Process option counts are computed from rows that match the current `changeType` filter.
- The visible gap list uses both filters.
- The badge shows filtered count and total count.
- The top counts and options must preserve the donor labels `Addition`, `Remove`, `Correction`, `Verification`, `Enrichment`, `Reprocess`, `User change`, and `Other`.
- Gap message truncation must preserve the donor collapsed/expanded behavior, including `[Show more]` and `[Show less]`.

## Zustand Store Details
Create `auditStore.ts` using `zustand` and the same style as `aurorra_index\src\features\metdata\store\indexStore.ts`.

Initial state:
- `activeSession: null`
- `error: null`
- `report: null`
- `status: "idle"`

State transitions:
- `setLoading(session)` sets `activeSession`, clears `error`, preserves `report`, sets `status` to `"loading"`.
- `setRefreshing(session)` sets `activeSession`, clears `error`, preserves `report`, sets `status` to `"refreshing"`.
- `setLoaded(session, report)` sets `activeSession`, clears `error`, stores `report`, sets `status` to `"success"`.
- `setError(error)` stores `error` and sets `status` to `"error"`.
- `resetAudit()` restores the initial state and a fresh `report` reference.

Do not add filter state to the store.

## Hook Implementation Details
Create `useAuditReport.ts` as a pure React hook using the package worker client.

Behavior:
- Initial mount loads the report for the current `session`.
- `workerClient` is optional and defaults to `createAuditWorkerClient({ apiBaseUrl: apiGatewayUrl })`.
- Successful load updates store state and calls `callbacks.onAuditLoaded(report)` only when `callbacks.onAuditLoaded` is defined.
- Errors normalize to `AuditWorkerError`, update store state, and call `callbacks.onAuditError`.
- Unmount calls `callbacks.onAuditCanceled`.
- The hook returns the current `report`, `status`, and `error`.
- Do not add start, ack, controller, or dialog behavior.

## Component Implementation Details
Create `AuditPanel.tsx`, `AuditSummary.tsx`, `AuditFilters.tsx`, and `AuditGaps.tsx` as pure React components.

Audit panel rules:
- `AuditPanel` owns the local filter state with this exact initial value: `{ changeType: "", process: "" }`.
- `AuditPanel` renders a loading progress indicator while the report is loading or refreshing.
- `AuditPanel` renders `No gaps found.` when the report is empty.
- `AuditPanel` renders `AuditSummary`, `AuditFilters`, and `AuditGaps` when data is present.
- `AuditPanel` must not render a `dialog` role.
- `AuditPanel` must not import, create, or close the host dialog.

Summary rules:
- `AuditSummary` renders the `Audit report` title.
- `AuditSummary` renders costs only when present.
- `AuditSummary` renders the filtered count and the `Out of {total}` badge text.

Filter rules:
- `AuditFilters` renders change type and process selects.
- Change type options are `All`, `Addition`, `Remove`, and `Correction`.
- Process options are `All`, `Verification`, `Enrichment`, `Reprocess`, `User change`, and `Other`.
- Option labels include the current counts.

Gap rules:
- `AuditGaps` renders the filtered gap rows.
- Gap rows render the aspect label, date label, message, and process label.
- Gap rows render collapsed messages with `[Show more]`.
- Expanded messages show `[Show less]`.
- `No gaps found.` is the empty state.
- Message collapse state belongs inside `AuditGaps`.
- Collapse behavior must match the donor viewer: messages with 200 characters or less render without a toggle; longer messages render the first 200 characters followed by `... ` and `[Show more]`; expanding renders the full message followed by `[Show less]`.

## Visual Test Details
Create:
- `aurorra_index\tests\visual\audit.visual.tsx`
- `aurorra_index\tests\visual\audit.visual.spec.ts`

Update:
- `aurorra_index\tests\visual\addressmap.visual-entry.js`

Exact visual entry update:
- In `addressmap.visual-entry.js`, add `else if (scenario === "audit") { await import("./audit.visual.tsx"); }` between the existing `legal-gap` branch and the default addressmap branch.
- Do not change the default scenario; it must keep importing `./addressmap.visual.tsx`.

Visual harness:
- Render `AuditPanel` with a worker test double.
- Fixture report contains:
  - first raw gap: `{ aspect: "ADD", changeType: "ADD", date: "2026-01-03T12:00:00Z", message: "Newest addition message", page: 3, process: "verification" }`
  - second raw gap: `{ aspect: "REMOVE", changeType: "REMOVE", date: "2026-01-01T12:00:00Z", message: "Old remove message", page: 1, process: "user" }`
  - third raw gap: `{ aspect: "CORRECTION", changeType: "CORRECTION", date: "2026-01-02T12:00:00Z", message: "<long message over 200 characters>", page: 2, process: "enrichment" }`
  - one usage block with costs
- Browser test must verify:
  - `Audit report` is visible.
  - The costs text is visible.
  - The badge count and `Out of` text are visible.
  - The change type and process filters are visible.
  - The visible sort order is `Newest addition message`, then the long correction message, then `Old remove message`.
  - `Show more` expands the long message and `Show less` collapses it.
  - The panel has no dialog role.

## `document_web` Adapter Implementation Details
After package tests pass, update `document_web`.

Create no audit data logic in `document_web`. Only mount package UI and preserve the existing refresh signal bridge.

Production edits:
- Create `document_web\src\features\audit\legacy\auditRuntime.ts`.
- Create `document_web\src\features\audit\component\AuditHost.tsx`.
- Create `document_web\src\features\audit\type\audit.types.ts`.
- Create `document_web\src\features\audit\test\AuditHost.vitest.test.tsx`.
- Create `document_web\src\features\audit\test\auditRuntime.vitest.test.ts`.
- Remove audit legacy imports from `document_web\src\bootstrap\app-imports.ts`:
  - `../domains/audit/data/auditdatahelper.js`
  - `../domains/audit/shell/auditviewer.js`
  - `../domains/audit/svc/audit_service.js`
- Update `document_web\src\domains\workflow\svc\orchestrator.js` so `onShowAuditReport` no longer calls `AuditController.showReport(layoutMode)`.
- Use the same layout flow already present in `onShowAuditReport`: read `layoutMode`, preserve the studio-mode duplicate-view shake behavior, then set layout type to `AUDITREPORT`.
- Do not add a replacement audit mount call in `orchestrator.js`; `AuditHost` is the only mount owner.
- Update `document_web\src\app\shell\component\AppShell.tsx` to import `AuditHost` from `../../../features/audit/component/AuditHost` and render `<AuditHost />` inside the returned fragment after `<IqHost />`.
- Do not change the existing static `<dialog id="dialog-container" role="region" aria-label="Dialog Container" />` element in `AppShell.tsx`.
- The mounting path must pass these props to `AuditPanel`:
  - `session` from the `useAppStore` `session` selector in `AuditHost`
  - `apiGatewayUrl` from `ENV.user_service_url`, matching `document_web\src\features\index\legacy\indexRuntime.ts`
  - `authToken` from `resolveIndexAuthToken(userToken)`
  - `callbacks.onAuditError` that emits the existing app alert
- Reuse `resolveIndexAuthToken` from `document_web\src\features\index\legacy\indexRuntime.ts` for token extraction. Do not duplicate token parsing.
- `AuditHost` must read `userToken`, `layout_mode`, `layout_type`, and `session` from `useAppStore`.
- `AuditHost` must read `resetParam` from `useAppStore`.
- `AuditHost` must call `resolveAuditProps(userToken, { layoutMode: layout_mode, layoutType: layout_type, session })`.
- `AuditHost` returns `null` when `resolveAuditProps` returns `null`.
- `AuditHost` uses `createPortal` from `react-dom`.
- When `layout_mode === PARAMS.layout_mode.values.STUDIOMODE`, portal `<AuditPanel {...props} />` into `document.getElementById("preview-container")`.
- When the preview target element is missing, return `null`.
- When `layout_mode === PARAMS.layout_mode.values.TABLETMODE`, render the same `Dialog` structure used by `document_web\src\features\iq\component\IqHost.tsx`, with title text `Audit report`, `onClose={() => resetParam("layout_type")}`, and child `<AuditPanel key={auditRevision} {...props} />`.
- When `layout_mode === PARAMS.layout_mode.values.KIOSKMODE`, render the same `Dialog` structure used by `document_web\src\features\iq\component\IqHost.tsx`, with title text `Audit report`, `onClose={() => resetParam("layout_type")}`, and child `<AuditPanel key={auditRevision} {...props} />`.
- In dialog placement, `AuditHost` must not imperatively mutate `#dialog-container`.
- To preserve the existing audit refresh behavior on `refineSegmentComplete`, `AuditHost` must own `const [auditRevision, setAuditRevision] = useState(0)`.
- `AuditHost` must subscribe with `EventBus.listen(EVENTS.refineSegmentComplete, handler)` in `useEffect`.
- The handler must increment `auditRevision` only when `layout_type === PARAMS.layout_type.values.AUDITREPORT`.
- The effect cleanup must call `EventBus.off(EVENTS.refineSegmentComplete, handler)`.
- In studio placement, render `<AuditPanel key={auditRevision} {...props} />` inside the preview portal.
- Do not add audit refresh state to `useAppStore`.
- `aurorra_index` must receive no `layoutMode` prop.
- `AuditPanel` must not import, create, or close the host dialog.

Exact `auditRuntime.ts` exports:
- `resolveAuditProps(userToken: unknown, state: AuditRuntimeState): AuditPanelProps | null`
- `auditCallbacks: AuditCallbacks`
- `showAuditError(error: unknown): void`

Exact `AuditRuntimeState` shape:
- Create `document_web\src\features\audit\type\audit.types.ts`.
- Export `AuditRuntimeState` with fields:
  - `layoutMode: unknown`
  - `layoutType: unknown`
  - `session: unknown`

Exact `resolveAuditProps` behavior:
- Return `null` unless `state.layoutType === PARAMS.layout_type.values.AUDITREPORT`.
- Return `null` unless `state.session` is a non-empty string.
- Use `resolveIndexAuthToken(userToken)` for `authToken`.
- Return `null` when auth token is missing.
- Return `{ authToken, apiGatewayUrl: ENV.user_service_url, callbacks: auditCallbacks, session }`.

Exact `auditCallbacks` behavior:
- `onAuditError(error)` calls `showAuditError(error)`.
- Do not define `onAuditLoaded`.
- Do not define `onAuditCanceled`.
- Do not add no-op dialog or controller callbacks.
- `showAuditError(error)` must use the same error formatting order as `resolveErrorMessage` in `document_web\src\features\index\legacy\indexRuntime.ts`, then emit `EventBus.emit(EVENTS.showAlert, { message })`.

## Legacy Files After Cutover
After the new package path and adapter tests pass, these files must have no active imports:
- `document_web\src\domains\audit\api\todo.md`
- `document_web\src\domains\audit\data\auditdatahelper.js`
- `document_web\src\domains\audit\shell\auditviewer.js`
- `document_web\src\domains\audit\svc\audit_service.js`

Delete the old audit files only in the same implementation pass that removes their imports and replaces their tests. Do not leave dead files.

## Existing Donor Tests To Port Or Replace
Port behavior from:
- `document_web\src\domains\audit\svc\tests\auditadapter-contract.unit.test.js`
- `document_web\src\domains\audit\svc\tests\auditservice-controller.unit.test.js`
- `document_web\src\domains\audit\svc\tests\auditservice-domain.unit.test.js`
- `document_web\src\domains\audit\svc\tests\audit-loader.unit.test.js`
- `document_web\src\domains\audit\data\tests\auditdatahelper.unit.test.js`
- `document_web\src\domains\audit\data\tests\auditdata-loader.unit.test.js`
- `document_web\src\domains\audit\shell\test\auditviewer-filters.unit.test.js`

## Existing document_web Tests To Replace
Replace the current refresh coverage after the cutover:
- `document_web\src\domains\workflow\tests\orchestrator-refresh-audit.unit.test.js`

## Boundary Rules
`aurorra_index\src\features\audit` must contain none of these strings:
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
- `AuditController`
- `AuditView`
- `AuditAdapter`
- `AuditViewer`
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
5. Browser verification for audit preview placement using a local document_web run with `layout_type` set to `AUDITREPORT` and `layout_mode` set to `STUDIOMODE`; verify `Audit report`, costs, filters, gaps, and refresh after `refineSegmentComplete`.
6. Browser verification for audit dialog placement using a local document_web run with `layout_type` set to `AUDITREPORT` and `layout_mode` set to `TABLETMODE`; verify `Audit report`, costs, filters, gaps, close behavior, and refresh after `refineSegmentComplete`.

Grep gates:
1. `rg -n "globalThis|\\bUI\\b|EventBus|\\bEVENTS\\b|\\bENV\\b|\\bAPI\\b|WorkerHelper|AlertHelper|ALERT_MESSAGES|document_web|AuditController|AuditView|AuditAdapter|AuditViewer|document\\.createElement|appendChild|innerHTML" aurorra_index/src/features/audit`
2. `rg -n "[ \\t]+$" aurorra_index/src/features/audit aurorra_index/docs/tasks/audit-refactor-plan.md`
3. `rg -n "domains/audit/(data|shell|svc)|AuditController|AuditViewer|auditdatahelper" document_web/src/bootstrap document_web/src/domains/workflow`

The first grep command must return no matches. The second grep command must return no matches. The third grep command must return no matches after `document_web` cutover.

## Hard Stops
Stop if:
- Spark needs to choose a file name not listed in this contract.
- Spark needs to add a prop not listed in this contract.
- Spark needs to export a type not listed in this contract.
- Spark needs to add a state field not listed in this contract.
- Spark needs to choose dialog or preview placement inside `aurorra_index`.
- Spark needs to preserve an audit controller, adapter, service, viewer class, or global export.
- Backend audit response shape differs from `rout_index_data_api.md` and the current donor audit tests.
- Visual behavior cannot be verified in browser.
- Any verification command fails for a reason caused by the audit transfer.
