import type {
  IndexApplyResult,
  IndexReprocessResult,
  IndexWorkerCommand,
  IndexWorkerResult,
  MetadataPayload,
} from "../type/metadata.types";

type IndexDataEnvelope = {
  data: string;
  status: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateMetadataPayload(data: unknown): IndexWorkerResult<MetadataPayload> {
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

function validateIndexDataEnvelope(data: unknown): IndexWorkerResult<IndexDataEnvelope> {
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

function parseMetadataData(data: string): IndexWorkerResult<MetadataPayload> {
  let payload: unknown;
  try {
    payload = JSON.parse(data);
  } catch {
    return { ok: false, code: "invalid_json", error: "Response data JSON could not be parsed." };
  }
  return validateMetadataPayload(payload);
}

function resolveIndexData(payload: unknown): IndexWorkerResult<MetadataPayload> {
  const envelope = validateIndexDataEnvelope(payload);
  if (!envelope.ok) return envelope;
  if (envelope.data.status === "error") {
    return { ok: false, code: "index_error", details: envelope.data, error: envelope.data.data };
  }
  if (envelope.data.status !== "completed") {
    return { ok: false, code: "index_not_completed", details: envelope.data, error: envelope.data.status };
  }
  return parseMetadataData(envelope.data.data);
}

function resolveReprocess(payload: unknown): IndexWorkerResult<IndexReprocessResult> {
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

function resolveApply(payload: unknown): IndexWorkerResult<IndexApplyResult> {
  if (!isObject(payload)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid object." };
  }
  if (typeof payload.applied !== "boolean") {
    return { ok: false, code: "validation_error", error: "Missing required key: applied" };
  }
  if (typeof payload.patches !== "number") {
    return { ok: false, code: "validation_error", error: "Missing required key: patches" };
  }
  if (payload.applied !== true) {
    return { ok: false, code: "index_not_applied", details: payload, error: "Index update was not applied." };
  }
  return { ok: true, data: { applied: true, patches: payload.patches } };
}

type ParsedResponse = {
  contentType: string;
  payload: unknown;
  response: Response;
};

async function parseResponse(response: Response): Promise<IndexWorkerResult<ParsedResponse>> {
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

function httpError(parsed: ParsedResponse): IndexWorkerResult<never> {
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
  buildRequest(command: IndexWorkerCommand): { body: string | null; method: "GET" | "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    const session = encodeURIComponent(command.session);
    if (command.type === "reprocessSegment") {
      return { body: JSON.stringify({}), method: "POST", url: `${apiBaseUrl}/v1/reprocess/${session}/${encodeURIComponent(command.segment)}` };
    }
    if (command.type === "confirmIndex") {
      return { body: null, method: "POST", url: `${apiBaseUrl}/v1/reprocess/${session}/confirm/${encodeURIComponent(command.code)}` };
    }
    if (command.type === "dropIndex") {
      return { body: null, method: "POST", url: `${apiBaseUrl}/v1/reprocess/${session}/drop/${encodeURIComponent(command.code)}` };
    }
    return { body: null, method: "GET", url: `${apiBaseUrl}/v1/index/${session}/data` };
  }

  async run(command: IndexWorkerCommand): Promise<IndexWorkerResult<MetadataPayload | IndexReprocessResult | IndexApplyResult>> {
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
    if (command.type === "reprocessSegment" && (typeof command.segment !== "string" || !command.segment.trim())) {
      return { ok: false, code: "invalid_segment", error: "Segment is missing or invalid." };
    }
    if (command.type !== "indexData" && command.type !== "reprocessSegment" && command.type !== "confirmIndex" && command.type !== "dropIndex") {
      return { ok: false, code: "invalid_command", error: "Unknown index worker command." };
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
    if (command.type === "confirmIndex" || command.type === "dropIndex") return resolveApply(parsed.data.payload);
    return resolveIndexData(parsed.data.payload);
  }
}

self.onmessage = async (event: MessageEvent<IndexWorkerCommand>) => {
  const worker = new IndexWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
