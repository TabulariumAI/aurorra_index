# IQ report flow

The IQ package uses one public report request: GET `/v1/iq/{session}/data`.
Gate acknowledgement remains POST `/v1/iq/{session}/gates/{code}/ack`.

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
mutating the panel store. `IqWorkerClient` exposes report loading and gate
acknowledgement; public start and polling commands have been removed.

The document_web framework forwards completed aurora-admin verification gates
and weights events to its IQ Refresh flow. Package collaboration passes through
the framework. Canceled/failed edits, unrelated model parts, and other document
classes do not force an IQ refresh.

IQ publication uploads serialized report JSON before publishing success.
`IqDataHubBridge` stores its SHA-256 in `success.flag.etag`, alongside the blob
name and publication date. Gate acknowledgement uses the same publication path;
the IQ endpoint coordinates acknowledgment, report loading, and upload while the
IQ helper owns the versioned locking and completion lifecycle.

Verification covers the worker query contract, metadata resource selection,
forced refresh, shared success/error callbacks, reset/reopen races, event forwarding,
service reuse/generation/waiting branches, report hashing, and Edge rendering at
390px and 1440px.

The IQ data response carries the report and its generated `metadataEtag` when available.
The report store retains that source until a replacement report loads and clears
it on a session change. The package compares it with the current session metadata;
the host receives only the resulting refresh presentation state.

Open and Restore use the current session metadata ETag when present and an explicit empty parameter when absent. Missing ETags do not block loading. The host displays a dismissible informational dialog without blocking metadata or waiting for recovery. IQ renders content-shaped placeholders for the score card, segment table, and compliance gates using its existing layout styles and Core loading semantics and skeleton styling, without host loading/readiness callbacks. Unknown scores, counts, and statuses remain neutral shapes hidden from assistive technology; section labels and table headers remain readable. Header Refresh and background generation still omit the ETag. A running gateway build is awaited and reused, including its failure result.
