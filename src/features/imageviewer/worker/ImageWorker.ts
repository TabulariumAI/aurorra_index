import { parsePackageMetadata } from "../data/imageViewerData";
import type {
  DataResponse,
  LocalPackage,
  PackageData,
  PackageResponse,
  WorkerCommand,
  WorkerResult,
} from "../type/imageViewer.types";

type ParsedResponse = {
  payload: unknown;
  response: Response;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function commandError(error: string): WorkerResult<never> {
  return { ok: false, code: "invalid_command", error };
}

function packageError(payload: Record<string, unknown>): WorkerResult<never> {
  if (typeof payload.data !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: data" };
  }
  return { ok: false, code: "image_package_error", details: payload, error: payload.data };
}

function readEnvelope(payload: unknown): WorkerResult<PackageResponse> {
  if (!isObject(payload)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid object." };
  }
  if (typeof payload.status !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: status" };
  }
  if (typeof payload.data !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: data" };
  }
  if (payload.status === "error") return packageError(payload);
  return { ok: true, data: { data: payload.data, status: payload.status } };
}

function readDataEnvelope(payload: unknown): WorkerResult<DataResponse> {
  if (!isObject(payload)) {
    return { ok: false, code: "validation_error", error: "Response is not a valid object." };
  }
  if (typeof payload.status !== "string") {
    return { ok: false, code: "validation_error", error: "Missing required key: status" };
  }
  if (payload.status === "error") return packageError(payload);
  if (payload.status !== "completed") {
    return { ok: false, code: "validation_error", details: payload, error: "Image package data status is invalid." };
  }
  if (!isObject(payload.data) || typeof payload.data.tiff !== "string" || typeof payload.data.data !== "string") {
    return { ok: false, code: "validation_error", details: payload, error: "Image package data is missing TIFF or JSON URLs." };
  }
  const data: PackageData = {
    data: payload.data.data,
    tiff: payload.data.tiff,
  };
  if (!/^https?:\/\//i.test(data.tiff) || !/^https?:\/\//i.test(data.data)) {
    return { ok: false, code: "validation_error", details: payload, error: "Image package data is missing TIFF or JSON URLs." };
  }
  return { ok: true, data: { data, status: "completed" } };
}

async function parseResponse(response: Response): Promise<WorkerResult<ParsedResponse>> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const responseText = await response.text();
  if (responseText && contentType.includes("application/json")) {
    try {
      return { ok: true, data: { payload: JSON.parse(responseText), response } };
    } catch {
      return { ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: response.status };
    }
  }
  if (response.ok) {
    return { ok: false, code: "non_json_response", error: "Response is not JSON.", status: response.status };
  }
  return { ok: true, data: { payload: responseText, response } };
}

function readHttpError(parsed: ParsedResponse): WorkerResult<never> {
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

async function fetchApi(
  url: string,
  token: string,
  init: RequestInit,
  type: Exclude<WorkerCommand["type"], "imageDownload">,
): Promise<WorkerResult<DataResponse | PackageResponse>> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  const parsed = await parseResponse(response);
  if (!parsed.ok) return parsed;
  if (!response.ok) return readHttpError(parsed.data);
  return type === "imageData" ? readDataEnvelope(parsed.data.payload) : readEnvelope(parsed.data.payload);
}

async function downloadPackage(tiffUrl: string, jsonUrl: string): Promise<LocalPackage> {
  const [tiffResponse, jsonResponse] = await Promise.all([fetch(tiffUrl), fetch(jsonUrl)]);
  if (!tiffResponse.ok) throw { error: `HTTP ${tiffResponse.status}`, status: tiffResponse.status };
  if (!jsonResponse.ok) throw { error: `HTTP ${jsonResponse.status}`, status: jsonResponse.status };
  const tiffBlob = await tiffResponse.blob();
  const packageMetadata = parsePackageMetadata(await jsonResponse.json());
  return {
    packageMetadata,
    tiffBytes: await tiffBlob.arrayBuffer(),
    tiffType: tiffBlob.type,
  };
}

export class ImageViewerWorker {
  buildRequest(command: Exclude<WorkerCommand, { type: "imageDownload" }>): { body: BodyInit | null; method: "GET" | "POST"; url: string } {
    const apiBaseUrl = command.apiBaseUrl.replace(/\/+$/, "");
    const session = encodeURIComponent(command.session);
    if (command.type === "imagePackage") {
      return { body: "{}", method: "POST", url: `${apiBaseUrl}/v1/image/${session}/package` };
    }
    if (command.type === "imageStatus") {
      return { body: null, method: "GET", url: `${apiBaseUrl}/v1/image/${session}/status` };
    }
    return { body: null, method: "GET", url: `${apiBaseUrl}/v1/image/${session}/data` };
  }

  async run(command: WorkerCommand): Promise<WorkerResult<DataResponse | PackageResponse | LocalPackage>> {
    if (!command?.token) return { ok: false, code: "missing_auth_token", error: "Missing auth token" };
    if (command.type === "imageDownload") {
      if (!command.tiffUrl || !command.jsonUrl) return commandError("Signed package URLs are missing.");
      try {
        return { ok: true, data: await downloadPackage(command.tiffUrl, command.jsonUrl) };
      } catch (error) {
        const candidate = error as { error?: unknown; status?: unknown };
        return {
          ok: false,
          error: typeof candidate?.error === "string" ? candidate.error : error instanceof Error ? error.message : String(error),
          status: typeof candidate?.status === "number" ? candidate.status : undefined,
        };
      }
    }
    if (!("apiBaseUrl" in command) || !command.apiBaseUrl) return { ok: false, code: "missing_api_base_url", error: "Missing service base URL" };
    if (typeof command.session !== "string" || !command.session.trim()) return { ok: false, code: "invalid_session", error: "Session is missing or invalid." };
    if (command.type !== "imagePackage" && command.type !== "imageStatus" && command.type !== "imageData") {
      return commandError("Unknown image viewer worker command.");
    }
    const request = this.buildRequest(command);
    return fetchApi(request.url, command.token, {
      body: request.body,
      headers: request.body ? { "Content-Type": "application/json" } : undefined,
      method: request.method,
    }, command.type);
  }
}

self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const worker = new ImageViewerWorker();
  const result = await worker.run(event.data);
  if (result.ok && event.data.type === "imageDownload") {
    (self as unknown as { postMessage(message: unknown, transfer: Transferable[]): void }).postMessage(result, [(result.data as LocalPackage).tiffBytes]);
    return;
  }
  self.postMessage(result);
};
