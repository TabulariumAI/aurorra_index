# Aurorra Index

Aurorra Index provides React components for document metadata review, visual indexing, mapping, auditing, and index-quality workflows in the Tabularium AI platform.

It is a host-integrated package. The host provides authentication, API gateway configuration, document/session context, and presentation framing. Aurora service implementations, credentials, customer documents, and live storage URLs are not included.

## Features

- Metadata review and index add, edit, confirm, drop, refine, and reprocess workflows
- Image viewing and page-segment management
- Address and legal mapping
- Audit, index-quality, and service-usage panels
- Queue and pending-change state for document workflows

## Requirements

- Node.js 22
- npm
- A sibling `aurora_core` checkout, which provides the local `aurora-core` dependency used during development

## Install

```sh
npm install
```

## Use

The package exports the host-integrated `IndexContainer`, `ImageViewerPanel`, `AddIndexPanel`, `EditIndexPanel`, `PageSegmentsPanel`, `AuditPanel`, and `IqPanel` components, along with their stores, workers, and types.

```tsx
import { IndexContainer, ImageViewerPanel } from "aurorra-index";
```

`ImageViewerPanel` requires the host `renderTolerance` callout renderer. Page-size rejection shows the source, page dimensions, and required tolerance. **Process anyway** retries the cached image package with a temporary tolerance; **Cancel**, Close, or Escape dismisses approval. The override is not persisted and is discarded when preview unmounts or its document changes.

`LegalMapContent` displays Plat and Address tabs with shared Summary, Address, and Reference sections. Supply `legal` and, when a property address exists, `addressMap: { address, content }`. The host supplies `AddressMapContent` as the address content and wraps only that content in its loading boundary. Unavailable tabs are hidden; Plat opens first when lot/block data exists, otherwise Address opens first. The metadata **Show Map** action calls `onLegalView()` when either lot/block data or a property address exists; reference-only data does not enable it.

See the exported prop types in [`src/public-api.ts`](src/public-api.ts). The host must supply valid credentials and compatible gateway endpoints.

## Development

```sh
npm install
npm run test:vitest
npm run typecheck
npm run lint:boundary
npm run build
npm run test:visual
```

`npm run test:visual` requires the configured Playwright browsers.

## Public Repository Notes

Do not commit credentials, authorization headers, SAS tokens, generated build output, test results, coverage, local environment files, or customer documents. Test fixtures must use non-routable URLs.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Service usage

`useUsage(owner)` runs the IndexedDB job for service events in loaded audit reports. Index completion, metadata refresh,
and queued reprocessing retrieve the latest audit URL from the gateway and download
the audit in the background. Opening Audit and refreshing Audit also retrieve a
fresh URL and report. An audit failure does not hide successful metadata. Use the workspace owner key formed
from gateway URL, subscription, and email. The job ignores existing GUIDs, keeps
only the previous and current UTC calendar months, and repeats cleanup at UTC
midnight. Unmounting the host stops the worker, subscription, and timer.
Each persisted record includes its session ID. Database version 2
rebuilds the usage cache from loaded audit reports to populate these IDs.

`UsagePanel` receives the persisted service records and provides service/date
selection, distinct session counts per service in the selected dates, daily or
Monday to Sunday weekly UTC charts, and average page cost
(total service cost divided by total pages used). Operations without pages show
"No pages used" instead of a numeric average. The host owns the dialog framing.

The four service groups are Extraction, IQ refinement, Refinement, and Model generation.
Each operation contributes one record per applicable group. `AuditPanel` shows group costs,
recorded processing times in seconds, and page counts across the loaded audit's complete history,
below the audit gaps. It does not display a separate total-cost line.
Audit gap filters do not filter service usage. Both panels use the same service grouping and labels.
