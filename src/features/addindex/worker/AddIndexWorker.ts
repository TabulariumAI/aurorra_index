import type {
  AddIndexResponse,
  AddIndexWorkerCommand,
  AddIndexWorkerResult,
} from "../type/addIndex.types";

type ParsedResponse = {
  payload: unknown;
  response: Response;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function parseResponse(response: Response): Promise<AddIndexWorkerResult<ParsedResponse>> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const text = await response.text();
  let payload: unknown = null;

  if (text && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(text);
    } catch {
      return { ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: response.status };
    }
  } else if (text) {
    payload = text;
  }

  if (response.ok && !contentType.includes("application/json")) {
    return { ok: false, code: "non_json_response", error: "Response is not JSON.", status: response.status };
  }
  return { ok: true, data: { payload, response } };
}

function httpError(parsed: ParsedResponse): AddIndexWorkerResult<never> {
  const { payload, response } = parsed;
  let error = `HTTP ${response.status}`;
  let code: string | undefined;
  let details: unknown;
  if (isObject(payload)) {
    if (typeof payload.error === "string") error = payload.error;
    else if (typeof payload.message === "string") error = payload.message;
    if (typeof payload.code === "string") code = payload.code;
    details = payload;
  } else if (typeof payload === "string" && payload.trim()) {
    error = payload.trim();
  }
  return { ok: false, code, details, error, status: response.status };
}

function addIndexResponse(parsed: ParsedResponse): AddIndexWorkerResult<AddIndexResponse> {
  const { payload, response } = parsed;
  if (!isObject(payload) || typeof payload.accepted !== "boolean" || typeof payload.description !== "string") {
    return { ok: false, code: "validation_error", details: payload, error: "Response is not a valid Add Index result.", status: response.status };
  }
  if (!payload.accepted) {
    return { ok: false, code: "index_not_added", details: payload, error: payload.description, status: response.status };
  }
  return { ok: true, data: { accepted: true, description: payload.description } };
}

export class AddIndexWorker {
  buildRequest(command: AddIndexWorkerCommand): { body: string; method: "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    return {
      body: JSON.stringify({
        value: command.value,
        source: command.source,
        aspect: command.aspect,
      }),
      method: "POST",
      url: `${apiBaseUrl}/v1/refine/${encodeURIComponent(command.session)}/add/index`,
    };
  }

  async run(command: AddIndexWorkerCommand): Promise<AddIndexWorkerResult<AddIndexResponse>> {
    if (!command?.token) {
      return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    }
    if (!command.apiBaseUrl) {
      return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    }
    if (typeof command.session !== "string" || !command.session.trim()) {
      return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    }
    if (typeof command.value !== "string" || !command.value.trim()) {
      return { ok: false, code: "invalid_value", error: "Index value is missing or invalid." };
    }
    if (typeof command.source !== "string") {
      return { ok: false, code: "invalid_source", error: "Index source is missing or invalid." };
    }
    if (typeof command.aspect !== "string" || !command.aspect.trim()) {
      return { ok: false, code: "invalid_aspect", error: "Index aspect is missing or invalid." };
    }
    if (command.type !== "addIndex") {
      return { ok: false, code: "invalid_command", error: "Unknown Add Index worker command." };
    }

    const request = this.buildRequest(command);
    let response: Response;
    try {
      response = await fetch(request.url, {
        body: request.body,
        headers: {
          Authorization: `Bearer ${command.token}`,
          "Content-Type": "application/json",
        },
        method: request.method,
      });
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    const parsed = await parseResponse(response);
    if (!parsed.ok) return parsed;
    if (!response.ok) return httpError(parsed.data);
    if (response.status !== 200) {
      return { ok: false, code: "validation_error", error: "Add Index response status must be 200.", status: response.status };
    }
    return addIndexResponse(parsed.data);
  }
}

self.onmessage = async (event: MessageEvent<AddIndexWorkerCommand>) => {
  const worker = new AddIndexWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
