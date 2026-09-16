# Contributing

## Requirements

- Node.js 22
- npm
- A sibling `aurora_core` checkout

## Local checks

```sh
npm install
npm run test:vitest
npm run typecheck
npm run lint:boundary
npm run build
npm run test:visual
```

## Guidelines

- Preserve host ownership of authentication, API gateway configuration, document/session context, and framing.
- Keep metadata, image viewer, mapping, audit, index-quality, and queue behavior in their existing feature areas.
- Add or update tests for behavior changes.
- Do not commit generated build output, coverage, test results, package tarballs, credentials, live storage URLs, or customer documents.
