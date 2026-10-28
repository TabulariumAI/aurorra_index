import type { ChoicesBackendData, ChoicesWorkerCommand, ChoicesWorkerResult } from "../type/choices.types";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export class ChoicesWorker {
  async run(command: ChoicesWorkerCommand): Promise<ChoicesWorkerResult<ChoicesBackendData>> {
    if (!command?.token) {
      return {
        ok: false,
        error: "Missing auth token",
        code: "missing_auth_token",
      };
    }

    if (!command.session || typeof command.session !== "string") {
      return {
        ok: false,
        error: "Session is missing or invalid.",
        code: "bad_request",
      };
    }

    const url = this.buildUrl(command);
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${command.token}`,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        error: message,
      };
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    let responseText: string;
    try {
      responseText = await response.text();
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error), status: response.status };
    }
    let payload: unknown = null;

    if (responseText && contentType.includes("application/json")) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        payload = responseText;
      }
    } else if (responseText) {
      payload = responseText;
    }

    if (response.ok) {
      if (!isObject(payload) || typeof payload.status !== "string" || typeof payload.data !== "string") {
        return { ok: false, code: "validation_error", error: "Invalid choices response envelope." };
      }
      if (payload.status === "error") return { ok: false, code: "choices_error", error: payload.data, details: payload };
      if (payload.status === "pending" || payload.status === "processing") return { ok: true, data: null };
      if (payload.status !== "completed") return { ok: false, code: "validation_error", error: "Invalid choices response status." };
      let choices: unknown;
      try {
        choices = JSON.parse(payload.data);
      } catch {
        return { ok: false, code: "invalid_json", error: "Choices JSON could not be parsed.", status: response.status };
      }
      if (!isObject(choices) || !Array.isArray(choices.items) || choices.items.some(item =>
        !isObject(item) || typeof item.service !== "string" || typeof item.level !== "number" || !Number.isInteger(item.level) || item.level < 0,
      ) || (choices.jurisdiction !== undefined && choices.jurisdiction !== null && typeof choices.jurisdiction !== "string")) {
        return { ok: false, code: "validation_error", error: "Invalid choices data." };
      }
      return { ok: true, data: choices as Exclude<ChoicesBackendData, null> };
    }

    let error = `HTTP ${response.status}`;
    let code: string | undefined;
    let details: unknown;

    if (isObject(payload)) {
      if (typeof payload.error === "string") {
        error = payload.error;
      }
      if (typeof payload.code === "string") {
        code = payload.code;
      }
      details = payload;
    }
    if (typeof payload === "string" && payload.trim()) {
      error = payload.trim();
    }

    return {
      ok: false,
      status: response.status,
      error,
      code,
      details,
    };
  }

  buildUrl(command: ChoicesWorkerCommand): string {
    return `${command.config.apiBaseUrl.replace(/\/+$/, "")}/v1/index/${encodeURIComponent(command.session)}/choices`;
  }
}

self.onmessage = async (event: MessageEvent<ChoicesWorkerCommand>) => {
  const worker = new ChoicesWorker();
  const result = await worker.run(event.data);
  self.postMessage(result);
};
