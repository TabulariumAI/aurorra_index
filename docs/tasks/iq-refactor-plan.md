# IQ report flow

`iqData` converts the service JSON into a fully prepared `IqReportView` before
rendering. It owns normalization, segment ordering, gate labels and clear
eligibility, note filtering and statuses, and score calculations. The service owns raw `notes`: report summaries
followed by missing-index findings not confirmed by cues and each segment's latest saved enrichment note. These findings are not
gates and do not contribute to gate lists or metrics. Prepared notes contain
`segment`, `message`, and `status`. Service notes contain `segment: string | null`
and `message: string`. Summaries, ambiguous-index warnings, and unconfirmed-index
information retain their producer's segment; other notes have no segment.
Notes starting with `Compliance gates` or `Indexing quality`
are excluded. `Unclassified indexes: Optimal` and `Unclassified indexes: Satisfied`
are success notes; other `Unclassified indexes` notes and every `Missing indexes`
note are warnings, as are notes prefixed with `WARNING:`. Unconfirmed-index notes
read `Required indexes were not confirmed: <fields>.` and are neutral.
Raw reports, transport, stores, and callbacks retain the service note objects.
Reports and prepared views have no decision field. Each prepared section contains either data
or its conversion error; segment explanation errors retain the segment row.
`IqView` renders this structure using the existing Core error UI and styles.
Quality, Compliance, and Notes use the shared Core `useTabs` control and Audit tab
styling. Quality contains score and segments; Compliance contains gate metrics and
actions; Notes displays prepared notes in reverse service order as separated rows
using the project's body typography and paragraph spacing. An available segment
uses the existing segment display naming and appears in bold above the message.
Ambiguous-index notes display a bold uppercase `WARNING:` label using the existing
dark amber IQ foreground (`#92400e`). Messages retain the standard text color.
Notes have no repeated heading or bullets. Messages over 30 words retain the
existing 25-word preview and keyboard-accessible expansion; the segment stays visible.
Disclosure controls reuse Core's compact icon-button style and the host's shared
hover and keyboard focus treatment. Quality explanations use one dedicated style;
unused note-card style variants are removed.
`IqPanel` retains request state, placeholders, refresh progress, and callbacks.
Indexing summary metrics consume the same prepared scores and section errors.

The IQ package uses one public report request: GET `/v1/iq/{session}/data`.
Gate acknowledgement uses POST `/v1/iq/{session}/gates/{code}/ack`; cue dismissal
uses POST `/v1/iq/{session}/cues/{code}/ack`.

Normal report loads resolve the session's `metadata_etag` resource and always send
the encoded `etag` query parameter, including `?etag=` when unavailable.
`loadIqReport`, `refreshIqReport`, and `generateIqReport` are separate public
facades over the same worker request. Refresh and background generation omit the
parameter. GET requests bypass the browser cache.

user_svc uses the presence of the request ETag to reuse existing IQ independently
of metadata availability or version differences. The client marks a report with
a different source ETag for Refresh. An omitted parameter requests generation;
an IQ report that has never been generated retains its existing initial-generation
behavior. Requests wait using the existing versioned status checks.
Forced requests also request a rebuild during an active job; existing internal
lock waits serialize generation. The internal
document_svc generation endpoint remains separate from the public user_svc API.

`loadIqReport` resolves metadata ETags through the package resource owner and passes
request values explicitly to the worker client. Workers and worker clients do not
read stores. It coordinates panel loading, shared reads, queued forced refresh,
per-caller completion/error callbacks, and late-response protection after session
changes. Store reset advances the request generation so reopening the same session
starts a new load and discards obsolete responses, retries, and queued refreshes.
`generateIqReport` performs the same forced GET for background actions without
mutating the panel store. `IqWorkerClient` exposes report loading and gate/cue
acknowledgement; public start and polling commands have been removed.

The document_web framework forwards completed aurora-admin verification gates
and weights events to its configured model-version comparison action. It marks
IQ as needing Refresh without generating another report. The user can continue
editing or choose Refresh. The action matches the report's class and jurisdiction
using the existing model scope key. Canceled/failed edits and other scopes do not
change that comparison. Package collaboration passes through the framework.

IQ generation uploads serialized report JSON before publishing success.
`IqDataHubBridge` derives `success.flag.etag` from SHA-256 of the JSON array
`[metadata_etag, verification_model, acknowledgements]`. The flag retains the
generated input ETag in `report_etag`, alongside the blob name, publication date,
source versions, and acknowledgements. Cue and gate acknowledgements update the
input ETag and acknowledgement list while preserving the generated baseline,
blob, and source versions. They do not generate or upload a report. The IQ
endpoint owns versioned locking, completion, and acknowledgment orchestration;
the IQ helper serializes and uploads generated reports.

Verification covers the worker query contract, metadata resource selection,
forced refresh, shared success/error callbacks, reset/reopen races, event forwarding,
service reuse/generation/waiting branches, input hashing, and Edge rendering at
390px and 1440px.

The IQ data response carries the generated `metadataEtag`, generated
`verificationEtag`, and the current scoped `verificationModel` when available.
The report store also retains the current input ETag, generated input ETag, and
acknowledgements. Successful acknowledgements remove only their displayed items;
scores, totals, explanations, notes, and the saved report remain unchanged. The
store retains these values until a replacement report loads and clears them on a
session change. An input ETag, metadata, or verification-model mismatch independently
marks Refresh. A model update during regeneration
remains visible if the returned calculation used an earlier version of the same
scope. The host uses the existing framework Refresh presentation.

Cue and gate acknowledgements use one persisted, owner-scoped queue. Each pending
item retains Core's row progress and failure recovery controls. Completion applies
only to the originating session and `reportGeneration`; it removes that item and
sets the returned input ETag without downloading or replacing the report. Failure
retains the item for explicit Retry or Cancel. Interrupted work requires explicit
retry. Existing owner snapshots retain their storage version. The separate load
`generation` continues to invalidate report downloads on owner reset. Refresh is
disabled while acknowledgement work remains; only explicit Refresh regenerates
the displayed report.

Open and Restore use the current session metadata ETag when present and an explicit empty parameter when absent. Missing ETags do not block loading. The host displays a dismissible informational dialog without blocking metadata or waiting for recovery. IQ renders content-shaped placeholders for the score card, segment table, and compliance gates using its existing layout styles and Core loading semantics and skeleton styling, without host loading/readiness callbacks. Unknown scores, counts, and statuses remain neutral shapes hidden from assistive technology; section labels and table headers remain readable. Header Refresh and background generation still omit the ETag. A running gateway build is awaited and reused, including its failure result.

Explicit IQ Refresh renders Core ProgressView with the decorative sequence “Checking segment quality…”, “Checking compliance gates…”, and “Generating IQ report…”. The existing retry interval advances the sequence; the final step remains active. A request retry restarts the sequence. The worker sends an `iqDownload` notification before fetching the report blob, switching the package to its existing placeholders. Normal data requests retain placeholders throughout. Background generation ignores the notification without changing panel state. The Core renderer is shared with Intake, Analysis, Capabilities, and Submit; the IQ timer and request state remain Index-owned.

Compliance descriptions remain service-owned. The view inserts one React `<br />` after a leading `Compliance is satisfied.` or `Compliance is not satisfied.` sentence when evidence follows. It preserves the service text, including quoted values, and does not interpret the rule or derive a status. Descriptions without that leading outcome are rendered unchanged. The old requirement-sentence formatter has been removed. Real-browser checks cover both outcomes, responsive wrapping, and keyboard acknowledgment; the mock report refresh applies the service's cleared status.
