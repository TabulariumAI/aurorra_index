import { retryInfo } from "aurora-core/retry-info";
import type { IqAckResult, IqReport, IqResource, IqWorkerCommand, IqWorkerEvent, IqWorkerResult } from "../type/iq.types";
import { fetchJson } from "../../../shared/worker/fetchJson";

type ParsedResponse = {
  contentType: string;
  payload: unknown;
  response: Response;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateReport(value: unknown): IqWorkerResult<IqReport> {
  if (!isObject(value)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid IQ report." };
  }
  if (Array.isArray(value.segments) && value.segments.some(segment => isObject(segment) && !("cues" in segment))) {
    return { ok: false, code: "cue_report_outdated", error: "The IQ report requires regeneration for cue review." };
  }
  return { ok: true, data: value as IqReport };
}

async function reportFromPayload(payload: unknown, onDownload?: () => void): Promise<IqWorkerResult<IqResource>> {
  if (isObject(payload) && payload.status === "error") {
    return { ok: false, code: "iq_error", details: payload, error: String(payload.data || payload.error || "error") };
  }
  if (isObject(payload) && payload.status === "completed" && typeof payload.data === "string") {
    onDownload?.();
    const result = await fetchJson(payload.data);
    if (!result.ok) return result;
    const report = validateReport(result.data);
    return report.ok ? { ok: true, data: {
      report: report.data,
      ...(typeof payload.etag === "string" ? { etag: payload.etag } : {}),
      ...(typeof payload.report_etag === "string" ? { reportEtag: payload.report_etag } : {}),
      ...(Array.isArray(payload.acknowledgements) ? { acknowledgements: payload.acknowledgements as IqResource["acknowledgements"] } : {}),
      ...(typeof payload.metadata_etag === "string" ? { metadataEtag: payload.metadata_etag } : {}),
      ...(typeof payload.verification_etag === "string" ? { verificationEtag: payload.verification_etag } : {}),
      ...(isObject(payload.verification_model) && typeof payload.verification_model.class === "string"
        && typeof payload.verification_model.etag === "string"
        && (payload.verification_model.jurisdiction === null || typeof payload.verification_model.jurisdiction === "string")
        ? { verificationModel: { class: payload.verification_model.class, jurisdiction: payload.verification_model.jurisdiction, etag: payload.verification_model.etag } } : {}),
    } } : report;
  }
  return { ok: false, code: "validation_error", error: "Response is not a valid IQ report." };
}

async function parseResponse(response: Response): Promise<IqWorkerResult<ParsedResponse>> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      return { ok: false, code: "invalid_json", ...retryInfo(response, "Response JSON could not be parsed."), status: response.status };
    }
  } else if (responseText) {
    payload = responseText;
  }

  if (response.ok && !contentType.includes("application/json")) {
    return { ok: false, code: "non_json_response", error: "Response is not JSON.", status: response.status };
  }

  return { ok: true, data: { contentType, payload, response } };
}

function httpError(parsed: ParsedResponse): IqWorkerResult<never> {
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
  return { ok: false, code, details, ...retryInfo(response, error), status: response.status };
}

export class IqWorker {
  buildRequest(command: IqWorkerCommand): { body: string | null; method: "GET" | "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    const session = encodeURIComponent(command.session);
    if (command.type === "iqAck" || command.type === "iqCueAck") {
      const kind = command.type === "iqAck" ? "gates" : "cues";
      return { body: null, method: "POST", url: `${apiBaseUrl}/v1/iq/${session}/${kind}/${encodeURIComponent(command.code)}/ack` };
    }
    return { body: null, method: "GET", url: `${apiBaseUrl}/v1/iq/${session}/data` };
  }

  async run(command: IqWorkerCommand, onDownload?: () => void): Promise<IqWorkerResult<IqResource | IqAckResult>> {
    if (!command?.token) {
      return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    }
    if (!command.apiBaseUrl) {
      return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    }
    if (typeof command.session !== "string" || !command.session.trim()) {
      return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    }
    if ((command.type === "iqAck" || command.type === "iqCueAck") && (typeof command.code !== "string" || !command.code.trim())) {
      return { ok: false, code: "invalid_gate_code", error: "Gate code is missing or invalid." };
    }
    if (command.type !== "iqData" && command.type !== "iqAck" && command.type !== "iqCueAck") {
      return { ok: false, code: "invalid_command", error: "Unknown IQ worker command." };
    }

    const request = this.buildRequest(command);
    let response: Response;
    try {
      response = await fetch(request.url, {
        body: request.body,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${command.token}`,
          ...(request.body ? { "Content-Type": "application/json" } : {}),
          ...(command.type === "iqData" && command.etag !== null ? { "If-None-Match": JSON.stringify(command.etag) } : {}),
        },
        method: request.method,
      });
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }

    const parsed = await parseResponse(response);
    if (!parsed.ok) return parsed;
    if (!response.ok) return httpError(parsed.data);
    if (command.type === "iqAck" || command.type === "iqCueAck") {
      if (!isObject(parsed.data.payload) || parsed.data.payload.status !== "completed" || typeof parsed.data.payload.etag !== "string") {
        return { ok: false, code: "iq_ack_incomplete", error: "Acknowledgment did not complete." };
      }
      return { ok: true, data: { status: parsed.data.payload.status, data: parsed.data.payload.data, etag: parsed.data.payload.etag, isComplete: true } };
    }
    const report = await reportFromPayload(parsed.data.payload, onDownload);
    if (!report.ok && report.code === "cue_report_outdated" && command.etag !== null) {
      return this.run({ ...command, etag: null }, onDownload);
    }
    return report;
  }
}

self.onmessage = async (event: MessageEvent<IqWorkerCommand>) => {
  const worker = new IqWorker();
  const result = await worker.run(event.data, () => self.postMessage({ type: "iqDownload" } satisfies IqWorkerEvent));
  self.postMessage(result);
};
