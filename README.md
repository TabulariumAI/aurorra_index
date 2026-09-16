# Aurorra Index

Aurorra Index provides React components for document metadata review, visual indexing, mapping, auditing, and index-quality workflows in the Tabularium AI platform.

It is a host-integrated package. The host provides authentication, API gateway configuration, document/session context, and presentation framing. Aurora service implementations, credentials, customer documents, and live storage URLs are not included.

## Features

- Metadata review and index add, edit, confirm, drop, refine, and reprocess workflows
- Image viewing and page-segment management
- Address and legal mapping
- Audit and index-quality panels
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
