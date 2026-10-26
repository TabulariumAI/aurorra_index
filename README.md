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

`LegalMapContent` displays the full-width summary description without a heading, followed by available map tabs in Lot & block, Address, Metes & Bounds, PLSS order, then the selected view’s data. PLSS and Lot & block expose their nonblank field names and values in one Details tab using the shared data panel, without column headings or source explanations. PLSS shows complete six-column township rows around the selected sections. PLSS uses solid slate-gray section boundaries with a 2px screen weight and stronger blue parcel outlines. Section numbers align inside the top of their cells and shrink with narrow cells to avoid overlapping quarter-section highlights. Lot & block, PLSS, and Metes & Bounds share a pale background with light gray dashed grid lines, compact 14px legend text and swatches, and the Metes & Bounds legend card spacing. Address uses the same outer frame and tab header; Google Maps retains its embedded content and controls. Every parcel drawing in Lot & block, Metes & Bounds and PLSS refits to the available map height after divider or viewport resizing. Boundary Calls tables follow all boundary drawings in a details panel that starts at 9.2rem. A full-width, 6px horizontal divider supports pointer and keyboard resizing. Aurora Index persists the last details proportion in its local Map store and restores it on reopen, refresh, and reload; viewport changes apply the proportion within the map and details size bounds. Each drawing reserves at least 6rem plus its actual header space so long annotations and multiple boundaries remain visible. Data tabs use underline tabs matching Aurora Batch. Boundary Calls retains complete and incomplete courses, or extracted bearings and distances when no courses can be paired; empty headers are omitted; Acreage and Easement require nonblank data. No data tabs, panel, or splitter are rendered when the selected view has no displayable data. Only the selected section is displayed. Reference tables are omitted; source metadata remains unchanged. Multiple parcels retain explicit unique parcel numbers from extracted explanations; groups without one keep source-order numbering. Groups without geometry retain compact issues; when the entire view lacks geometry, issues and measurements share the data-only scroll area without an empty map or splitter. Single-parcel views omit numbered headings and captions; an explicit single-parcel count is honored across multiple source groups. A parcel that cannot be mapped reports the pairing or parsing failure as a red error alert with the shared alert icon on a transparent surface; it does not receive a schematic. On narrow screens, the error stacks above the map tabs. Closure, Gap, and Tolerance diagnostics are not displayed; boundary closure geometry is preserved. Metes & Bounds retains complete source courses and curves, and restores the outline from complete extracted pairs when source parsing produces an unreadable or unpaired reference bearing. Paired extracted measurements can also render without source text. Unreadable calls stay in the table; later drawable courses use dashed unconfirmed styling with an explicit schematic warning. Vertex numbers retain source sequence. Ties remain dotted, distinct from parcel boundaries and unconfirmed segments. A closed parcel is retained when additional courses follow it; those courses stay visible as dashed Unconfirmed segments with amber table rows and a review notice, outside the parcel fill. Source metadata remains unchanged. Commas between bearing components do not split courses. Available acreage and easement details remain in their tabs; unpositioned measurements remain available and no missing courses are invented. Supply `legal` and, when a property address exists, `addressMap: { address, content }`. The host supplies `AddressMapContent` and wraps only the address content in its loading boundary. Unavailable tabs are hidden. The host owns Preview placement, content padding, Close, and Refresh; metadata changes redraw the content. The Content Panel does not scroll vertically. Maps adapt to the available height within their bounds; the selected details panel scrolls internally without nested table scroll containers, and Plat retains its existing scrollable drawing grid. Property **Show Map** calls `onLegalView()`; standalone property-address clicks retain their separate host path.

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

`useUsage(owner)` runs the IndexedDB job for service events in loaded audit reports. Fetched and cached metadata loads, metadata refresh,
and queued reprocessing retrieve the latest audit URL from the gateway and download
the audit in the background. Opening Audit and refreshing Audit also retrieve a
fresh URL and report. All Audit ingestion uses `loadAuditReport`. An audit failure does not hide successful metadata or clear stored usage. Metadata callbacks carry the source session ID and metadata tags so the host can request Batch-owned updates. Use the workspace owner key formed
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

### Survey terrain source

`src/features/legalmap/assets/survey-terrain.jpg` is a static USGS Topo crop of the Great Smoky Mountains region. It is decorative context and does not locate the property.

- Source: [USGS Topo service](https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer), combining shaded relief, land cover, contours, hydrography, transportation, and geographic names.
- Export: requested extent `-83.62,35.53,-83.42,35.65` (EPSG:4326); output EPSG:3857, 1200 × 900, JPEG, 96 DPI; retrieved 2026-10-22.
- Credits: USGS The National Map; USGS Global Ecosystems; U.S. Census Bureau TIGER/Line; USFS; Natural Earth; U.S. Department of State HIU; NOAA National Centers for Environmental Information. The service describes its constituent data as public domain.
- Section boundaries use solid 2px slate-gray strokes; subject boundaries use 3px blue strokes.
