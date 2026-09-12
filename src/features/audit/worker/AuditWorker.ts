import { normalizeAuditReport } from "../data/auditData";
import type { AuditReport, AuditWorkerCommand, AuditWorkerResult } from "../type/audit.types";
import { fetchJson } from "../../../shared/worker/fetchJson";

type ParsedResponse = {
  contentType: string;
  payload: unknown;
  response: Response;
};

type AuditEnvelope = {
  data: string;
  status: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateEnvelope(payload: unknown): AuditWorkerResult<AuditEnvelope> {
  if (!isObject(payload) || typeof payload.status !== "string" || typeof payload.data !== "string") {
    return { ok: false, code: "validation_error", error: "Response is not a valid audit envelope." };
  }
  return { ok: true, data: payload as AuditEnvelope };
}

async function reportFromPayload(payload: unknown): Promise<AuditWorkerResult<AuditReport>> {
  const result = validateEnvelope(payload);
  if (!result.ok) return result;
  const envelope = result.data;
  if (envelope.status === "error") {
    return { ok: false, code: "audit_error", details: envelope, error: envelope.data };
  }
  if (envelope.status !== "completed") {
    return { ok: false, code: "audit_not_completed", details: envelope, error: envelope.status };
  }
  const report = await fetchJson(envelope.data);
  if (!report.ok) return report;
  return { ok: true, data: normalizeAuditReport(report.data) };
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
    return { body: null, method: "GET", url: `${apiBaseUrl}/v1/metadata/${session}/audit` };
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

    return reportFromPayload(parsed.data.payload);
  }
}

self.onmessage = async (event: MessageEvent<AuditWorkerCommand>) => {
  const worker = new AuditWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
