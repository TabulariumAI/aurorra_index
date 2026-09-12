export type JsonResult =
  | { data: unknown; ok: true }
  | { code?: string; details?: unknown; error: string; ok: false; status?: number };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function fetchJson(url: string): Promise<JsonResult> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  if (response.ok) {
    try {
      return { data: await response.json(), ok: true };
    } catch {
      return { code: "invalid_json", error: "Response JSON could not be parsed.", ok: false, status: response.status };
    }
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const text = await response.text();
  let payload: unknown = text;
  if (text && contentType.includes("application/json")) {
    try {
      payload = JSON.parse(text);
    } catch {
      return { code: "invalid_json", error: "Response JSON could not be parsed.", ok: false, status: response.status };
    }
  }

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

  return { code, details, error, ok: false, status: response.status };
}
