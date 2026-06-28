import type { IqAckResult, IqReport, IqStartResult, IqWorkerCommand, IqWorkerResult } from "../type/iq.types";

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
  return { ok: true, data: value as IqReport };
}

function reportFromPayload(payload: unknown): IqWorkerResult<IqReport> {
  if (isObject(payload) && payload.status === "error") {
    return { ok: false, code: "iq_error", details: payload, error: String(payload.data || payload.error || "error") };
  }
  if (isObject(payload) && typeof payload.data === "string") {
    try {
      return validateReport(JSON.parse(payload.data));
    } catch {
      return { ok: false, code: "invalid_json", error: "Response data JSON could not be parsed." };
    }
  }
  return validateReport(payload);
}

function startFromPayload(payload: unknown): IqStartResult {
  const source = isObject(payload) ? payload : {};
  const status = String(source.status ?? "");
  return {
    status,
    data: source.data,
    isComplete: status === "completed",
  };
}

function ackFromPayload(payload: unknown): IqAckResult {
  const source = isObject(payload) ? payload : {};
  return {
    status: String(source.status ?? ""),
    data: source.data,
    isComplete: true,
  };
}

async function parseResponse(response: Response): Promise<IqWorkerResult<ParsedResponse>> {
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
  return { ok: false, code, details, error, status: response.status };
}

export class IqWorker {
  buildRequest(command: IqWorkerCommand): { body: string | null; method: "GET" | "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    const session = encodeURIComponent(command.session);
    if (command.type === "iqStart") {
      return { body: JSON.stringify({}), method: "POST", url: `${apiBaseUrl}/v1/iq/${session}/start` };
    }
    if (command.type === "iqAck") {
      return { body: null, method: "POST", url: `${apiBaseUrl}/v1/iq/${session}/gates/${encodeURIComponent(command.code)}/ack` };
    }
    return { body: null, method: "GET", url: `${apiBaseUrl}/v1/iq/${session}/data` };
  }

  async run(command: IqWorkerCommand): Promise<IqWorkerResult<IqReport | IqStartResult | IqAckResult>> {
    if (!command?.token) {
      return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    }
    if (!command.apiBaseUrl) {
      return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    }
    if (typeof command.session !== "string" || !command.session.trim()) {
      return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    }
    if (command.type === "iqAck" && (typeof command.code !== "string" || !command.code.trim())) {
      return { ok: false, code: "invalid_gate_code", error: "Gate code is missing or invalid." };
    }
    if (command.type !== "iqData" && command.type !== "iqStart" && command.type !== "iqAck") {
      return { ok: false, code: "invalid_command", error: "Unknown IQ worker command." };
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
    if (!response.ok) return httpError(parsed.data);
    if (command.type === "iqStart") return { ok: true, data: startFromPayload(parsed.data.payload) };
    if (command.type === "iqAck") return { ok: true, data: ackFromPayload(parsed.data.payload) };
    return reportFromPayload(parsed.data.payload);
  }
}

self.onmessage = async (event: MessageEvent<IqWorkerCommand>) => {
  const worker = new IqWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
