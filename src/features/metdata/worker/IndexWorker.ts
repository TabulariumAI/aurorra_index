import type { IndexWorkerCommand, IndexWorkerResult, MetadataPayload } from "../type/metadata.types";

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

export class IndexWorker {
  buildRequest(command: IndexWorkerCommand): { body: null; method: "GET"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    return {
      body: null,
      method: "GET",
      url: `${apiBaseUrl}/v1/index/${encodeURIComponent(command.session)}/data`,
    };
  }

  async run(command: IndexWorkerCommand): Promise<IndexWorkerResult<MetadataPayload>> {
    if (!command?.token) {
      return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    }
    if (!command.apiBaseUrl) {
      return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    }
    if (typeof command.session !== "string" || !command.session.trim()) {
      return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    }
    if (command.type !== "indexData") {
      return { ok: false, code: "invalid_command", error: "Unknown index worker command." };
    }

    const request = this.buildRequest(command);
    let response: Response;
    try {
      response = await fetch(request.url, {
        headers: {
          Authorization: `Bearer ${command.token}`,
        },
        method: request.method,
      });
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

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

    if (response.ok && !contentType.includes("application/json")) {
      return { ok: false, code: "non_json_response", error: "Response is not JSON.", status: response.status };
    }

    if (response.ok) return resolveIndexData(payload);

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

    return {
      ok: false,
      code,
      details,
      error,
      status: response.status,
    };
  }
}

self.onmessage = async (event: MessageEvent<IndexWorkerCommand>) => {
  const worker = new IndexWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
