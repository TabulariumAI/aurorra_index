import { normalizeAuditReport } from "../data/auditData";
import type { AuditReport, AuditWorkerCommand, AuditWorkerResult } from "../type/audit.types";

type ParsedResponse = {
  contentType: string;
  payload: unknown;
  response: Response;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function reportFromPayload(payload: unknown): Promise<AuditWorkerResult<AuditReport>> {
  if (isObject(payload) && payload.status === "error") {
    return { ok: false, code: "audit_error", details: payload, error: String(payload.data || payload.error || "error") };
  }
  if (isObject(payload) && payload.status === "completed" && typeof payload.data === "string") {
    let response: Response;
    try {
      response = await fetch(payload.data);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
    if (!response.ok) {
      const parsed = await parseResponse(response);
      if (!parsed.ok) return parsed;
      return parseError(parsed.data);
    }
    try {
      return { ok: true, data: normalizeAuditReport(await response.json()) };
    } catch {
      return { ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: response.status };
    }
  }
  if (isObject(payload) && isObject(payload.data)) {
    return { ok: true, data: normalizeAuditReport(payload.data) };
  }
  return { ok: true, data: normalizeAuditReport(payload) };
}

async function parseResponse(response: Response): Promise<AuditWorkerResult<ParsedResponse>> {
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

  return { ok: true, data: { contentType, payload, response } };
}

function parseError(parsed: ParsedResponse): AuditWorkerResult<never> {
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

export class AuditWorker {
  buildRequest(command: AuditWorkerCommand): { body: null; method: "GET"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    const session = encodeURIComponent(command.session);
    return { body: null, method: "GET", url: `${apiBaseUrl}/v1/index/${session}/audit` };
  }

  async run(command: AuditWorkerCommand): Promise<AuditWorkerResult<AuditReport>> {
    if (!command?.token) {
      return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    }
    if (!command.apiBaseUrl) {
      return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    }
    if (typeof command.session !== "string" || !command.session.trim()) {
      return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    }
    if (command.type !== "auditData") {
      return { ok: false, code: "invalid_command", error: "Unknown audit worker command." };
    }

    const request = this.buildRequest(command);
    let response: Response;
    try {
      response = await fetch(request.url, {
        body: request.body,
        headers: {
          Authorization: `Bearer ${command.token}`,
        },
        method: request.method,
      });
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    const parsed = await parseResponse(response);
    if (!parsed.ok) return parsed;
    if (!response.ok) return parseError(parsed.data);

    return await reportFromPayload(parsed.data.payload);
  }
}

self.onmessage = async (event: MessageEvent<AuditWorkerCommand>) => {
  const worker = new AuditWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
