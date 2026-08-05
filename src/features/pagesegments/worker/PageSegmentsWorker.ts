import type { PageSegmentsWorkerCommand, PageSegmentsWorkerResult } from "../type/pageSegments.types";

type ParsedResponse = {
  invalidJson: boolean;
  payload: unknown;
  response: Response;
  text: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const text = await response.text();
  let invalidJson = false;
  let payload: unknown = null;

  if (text && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(text);
    } catch {
      invalidJson = true;
    }
  } else if (text) {
    payload = text;
  }

  return { invalidJson, payload, response, text };
}

function httpError(parsed: ParsedResponse): PageSegmentsWorkerResult<never> {
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

export class PageSegmentsWorker {
  buildRequest(command: PageSegmentsWorkerCommand): { body: string; method: "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    return {
      body: JSON.stringify({ segments: command.segments }),
      method: "POST",
      url: `${apiBaseUrl}/v1/refine/${encodeURIComponent(command.session)}/page/${encodeURIComponent(command.pageCode)}/`,
    };
  }

  async run(command: PageSegmentsWorkerCommand): Promise<PageSegmentsWorkerResult<void>> {
    if (!command?.token) {
      return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    }
    if (!command.apiBaseUrl) {
      return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    }
    if (typeof command.session !== "string" || !command.session.trim()) {
      return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    }
    if (typeof command.pageCode !== "string" || !command.pageCode.trim()) {
      return { ok: false, code: "invalid_page_code", error: "Page code is missing or invalid." };
    }
    if (!Array.isArray(command.segments)) {
      return { ok: false, code: "invalid_segments", error: "Segments must be an array." };
    }
    if (command.type !== "updatePageSegments") {
      return { ok: false, code: "invalid_command", error: "Unknown page segments worker command." };
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
    if (response.status === 200) {
      if (parsed.text) {
        return { ok: false, code: "validation_error", error: "Page segment update response must be empty.", status: response.status };
      }
      return { ok: true, data: undefined };
    }
    if (!response.ok) {
      if (parsed.invalidJson) {
        return { ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: response.status };
      }
      return httpError(parsed);
    }
    return { ok: false, code: "validation_error", error: "Page segment update response status must be 200.", status: response.status };
  }
}

self.onmessage = async (event: MessageEvent<PageSegmentsWorkerCommand>) => {
  const worker = new PageSegmentsWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
