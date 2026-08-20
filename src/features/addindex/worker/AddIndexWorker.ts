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
  if (!isObject(payload) || typeof payload.data !== "string" || typeof payload.version !== "number") {
    return { ok: false, code: "validation_error", details: payload, error: "Response is not a valid Add Index result.", status: response.status };
  }
  if (payload.status !== "completed" && payload.status !== "error" && payload.status !== "pending" && payload.status !== "processing") {
    return { ok: false, code: "validation_error", details: payload, error: "Response is not a valid Add Index result.", status: response.status };
  }
  return { ok: true, data: payload as AddIndexResponse };
}

export class AddIndexWorker {
  buildRequest(command: Extract<AddIndexWorkerCommand, { type: "addIndex" }>): { body: string; method: "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    return {
      body: JSON.stringify({
        segment: command.segment,
        explanation: command.explanation,
        new_index_label: command.label,
        new_index_aspect: command.aspect,
        new_index_value: command.value,
      }),
      method: "POST",
      url: `${apiBaseUrl}/v1/refine/${encodeURIComponent(command.session)}/patch/add`,
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
    if (command.type !== "addIndex" && command.type !== "patchStatus") {
      return { ok: false, code: "invalid_command", error: "Unknown Add Index worker command." };
    }
    if (command.type === "patchStatus") {
      if (!Number.isInteger(command.version) || command.version < 0) {
        return { ok: false, code: "invalid_patch_version", error: "Patch version is missing or invalid." };
      }
    } else {
      if (typeof command.value !== "string" || !command.value.trim()) {
        return { ok: false, code: "invalid_value", error: "Index value is missing or invalid." };
      }
      if (typeof command.explanation !== "string" || !command.explanation.trim()) {
        return { ok: false, code: "invalid_explanation", error: "Index explanation is missing or invalid." };
      }
      if (typeof command.label !== "string" || !command.label.trim()) {
        return { ok: false, code: "invalid_label", error: "Index label is missing or invalid." };
      }
      if (typeof command.segment !== "string" || !command.segment.trim()) {
        return { ok: false, code: "invalid_segment", error: "Index segment is missing or invalid." };
      }
      if (typeof command.aspect !== "string" || !command.aspect.trim()) {
        return { ok: false, code: "invalid_aspect", error: "Index aspect is missing or invalid." };
      }
    }

    const request = command.type === "addIndex"
      ? this.buildRequest(command)
      : {
        body: null,
        method: "GET" as const,
        url: `${command.apiBaseUrl.replace(/\/+$/, "")}/v1/refine/${encodeURIComponent(command.session)}/patch/status/${command.version}`,
      };
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
