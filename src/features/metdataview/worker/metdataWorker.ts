import { validateChange } from "../../queue/data/indexChange";
import type { MetdataPatchResult, MetdataReprocessResult, MetdataWorkerCommand, MetdataWorkerResult } from "../type/metadataView.types";
import type { MetadataPayload } from "aurora-core";
import { fetchJson } from "../../../shared/worker/fetchJson";

type IndexDataEnvelope = {
  data: string;
  status: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateMetadataPayload(data: unknown): MetdataWorkerResult<MetadataPayload> {
  if (!isObject(data)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid object." };
  }
  for (const key of ["heading", "secrets", "indexes", "pages", "fees", "funds"]) {
    if (!(key in data)) {
      return { ok: false, code: "validation_error", error: `Missing required key: ${key}` };
    }
  }
  if (!isObject(data.heading)) {
    return { ok: false, code: "validation_error", error: "Invalid or missing heading section." };
  }
  if (!isObject(data.pages) || typeof data.pages.num_of_pages !== "number") {
    return { ok: false, code: "validation_error", error: "Invalid or missing pages section." };
  }
  return { ok: true, data: data as MetadataPayload };
}

function validateIndexDataEnvelope(data: unknown): MetdataWorkerResult<IndexDataEnvelope> {
  if (!isObject(data)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid object." };
  }
  if (typeof data.status !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: status" };
  }
  if (typeof data.data !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: data" };
  }
  return { ok: true, data: data as IndexDataEnvelope };
}

async function resolveIndexData(payload: unknown): Promise<MetdataWorkerResult<MetadataPayload>> {
  const envelope = validateIndexDataEnvelope(payload);
  if (!envelope.ok) return envelope;
  if (envelope.data.status === "error") {
    return { ok: false, code: "index_error", details: envelope.data, error: envelope.data.data };
  }
  if (envelope.data.status !== "completed") {
    return { ok: false, code: "index_not_completed", details: envelope.data, error: envelope.data.status };
  }
  const result = await fetchJson(envelope.data.data);
  if (!result.ok) return result;
  const metadata = validateMetadataPayload(result.data);
  return metadata.ok ? { ...metadata, path: envelope.data.data } : metadata;
}

function resolveReprocess(payload: unknown): MetdataWorkerResult<MetdataReprocessResult> {
  if (!isObject(payload)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid object." };
  }
  if (typeof payload.status !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: status" };
  }
  if (typeof payload.data !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: data" };
  }
  if (payload.status !== "completed") {
    return { ok: false, code: "reprocess_not_completed", details: payload, error: payload.status };
  }
  return { ok: true, data: { data: payload.data, status: "completed" } };
}

function resolvePatch(payload: unknown): MetdataWorkerResult<MetdataPatchResult> {
  if (!isObject(payload)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid object." };
  }
  if (typeof payload.data !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: data" };
  }
  if (payload.status !== "completed" && payload.status !== "error" && payload.status !== "pending" && payload.status !== "processing") {
    return { ok: false, code: "validation_error", error: "Invalid patch status." };
  }
  if (typeof payload.version !== "number") {
    return { ok: false, code: "validation_error", error: "Missing required key: version" };
  }
  return { ok: true, data: payload as MetdataPatchResult };
}

type ParsedResponse = {
  contentType: string;
  payload: unknown;
  response: Response;
};

async function parseResponse(response: Response): Promise<MetdataWorkerResult<ParsedResponse>> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      return { ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: response.status };
    }
  } else if (responseText) {
    payload = responseText;
  }

  return { ok: true, data: { contentType, payload, response } };
}

function httpError(parsed: ParsedResponse): MetdataWorkerResult<never> {
  const { payload, response } = parsed;
  let error = `HTTP ${response.status}`;
  let code: string | undefined;
  let details: unknown;
  if (isObject(payload)) {
    if (typeof payload.error === "string") error = payload.error;
    if (typeof payload.message === "string") error = payload.message;
    if (typeof payload.code === "string") code = payload.code;
    details = payload;
  } else if (typeof payload === "string" && payload.trim()) {
    error = payload.trim();
  }

  return { ok: false, code, details, error, status: response.status };
}

export class IndexWorker {
  buildRequest(command: MetdataWorkerCommand): { body: string | null; method: "GET" | "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    const session = encodeURIComponent(command.session);
    if (command.type === "patchIndex") {
      const { action, ...change } = command.change;
      const body = { segment: command.segment, explanation: change.explanation,
        ...(action !== "remove" ? { new_index_label: change.new_index_label, new_index_aspect: change.new_index_aspect, new_index_value: change.new_index_value, allow_enrichment: change.allow_enrichment ?? false } : {}),
        ...(action === "add" ? { new_index_page: change.new_index_page, new_index_source: change.new_index_source } : {}),
        ...(action === "update" ? { new_index_ambiguous: change.new_index_ambiguous } : {}),
        ...(action !== "add" ? { old_index_label: change.old_index_label, old_index_aspect: change.old_index_aspect, old_index_value: change.old_index_value } : {}),
      };
      return { body: JSON.stringify(body), method: "POST", url: `${apiBaseUrl}/v1/refine/${session}/patch/${action === "remove" ? "drop" : action}` };
    }
    if (command.type === "reprocessSegment") {
      return { body: JSON.stringify({}), method: "POST", url: `${apiBaseUrl}/v1/refine/${session}/reprocess/${encodeURIComponent(command.segment)}` };
    }
    if (command.type === "confirmIndex") {
      return { body: null, method: "POST", url: `${apiBaseUrl}/v1/refine/${session}/confirm/${encodeURIComponent(command.code)}` };
    }
    if (command.type === "dropIndex") {
      return { body: null, method: "POST", url: `${apiBaseUrl}/v1/refine/${session}/drop/${encodeURIComponent(command.code)}` };
    }
    if (command.type === "patchStatus") return { body: null, method: "GET", url: `${apiBaseUrl}/v1/refine/${session}/patch/status/${command.version}` };
    return { body: null, method: "GET", url: `${apiBaseUrl}/v1/metadata/${session}/data` };
  }

  async run(command: MetdataWorkerCommand): Promise<MetdataWorkerResult<MetadataPayload | MetdataReprocessResult | MetdataPatchResult>> {
    if (!command?.token) {
      return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    }
    if (!command.apiBaseUrl) {
      return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    }
    if (typeof command.session !== "string" || !command.session.trim()) {
      return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    }
    if ((command.type === "confirmIndex" || command.type === "dropIndex") && (typeof command.code !== "string" || !command.code.trim())) {
      return { ok: false, code: "invalid_index_code", error: "Index code is missing or invalid." };
    }
    if ((command.type === "reprocessSegment" || command.type === "patchIndex") && (typeof command.segment !== "string" || !command.segment.trim())) {
      return { ok: false, code: "invalid_segment", error: "Segment is missing or invalid." };
    }
    if (command.type === "patchStatus" && (!Number.isInteger(command.version) || command.version < 0)) {
      return { ok: false, code: "invalid_patch_version", error: "Patch version is missing or invalid." };
    }
    if (command.type !== "patchIndex" && command.type !== "indexData" && command.type !== "reprocessSegment" && command.type !== "confirmIndex" && command.type !== "dropIndex" && command.type !== "patchStatus") {
      return { ok: false, code: "invalid_command", error: "Unknown index worker command." };
    }

    if (command.type === "patchIndex") {
      try { validateChange(command.change); } catch (error) {
        const failure = error as Error & { code: string };
        return { ok: false, code: failure.code, error: failure.message };
      }
    }
    if (command.type === "indexData" && command.path) {
      const result = await fetchJson(command.path);
      if (!result.ok) return result;
      const metadata = validateMetadataPayload(result.data);
      return metadata.ok ? { ...metadata, path: command.path } : metadata;
    }
    const request = this.buildRequest(command);
    let response: Response;
    try {
      response = await fetch(request.url, {
        body: request.body,
        headers: {
          Authorization: `Bearer ${command.token}`,
          ...(request.body ? { "Content-Type": "application/json" } : {}),
        },
        method: request.method,
      });
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    const parsed = await parseResponse(response);
    const isMutation = command.type !== "indexData";
    if (!parsed.ok) {
      if (isMutation && response.ok) {
        return { ...parsed, code: "validation_error" };
      }
      return parsed;
    }
    if (!response.ok) return httpError(parsed.data);
    if (isMutation && response.status !== 200) {
      return { ok: false, code: "validation_error", error: "Mutation response status must be 200.", status: response.status };
    }
    if (!parsed.data.contentType.includes("application/json")) {
      return {
        ok: false,
        code: isMutation ? "validation_error" : "non_json_response",
        error: "Response is not JSON.",
        status: response.status,
      };
    }
    if (command.type === "reprocessSegment") return resolveReprocess(parsed.data.payload);
    if (command.type === "patchIndex" || command.type === "confirmIndex" || command.type === "dropIndex" || command.type === "patchStatus") return resolvePatch(parsed.data.payload);
    return resolveIndexData(parsed.data.payload);
  }
}

self.onmessage = async (event: MessageEvent<MetdataWorkerCommand>) => {
  const worker = new IndexWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
