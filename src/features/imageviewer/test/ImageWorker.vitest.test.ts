import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LocalPackage } from "../type/imageViewer.types";
import { ImageViewerWorker } from "../worker/ImageWorker";

const packageRoot = path.join(process.cwd(), "src", "test", "package");
const realPackageMetadata = JSON.parse(readFileSync(path.join(packageRoot, "image.json"), "utf8")) as { pages: unknown[] };
const realTiffBytes = readFileSync(path.join(packageRoot, "image.tiff"));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function tiffResponse() {
  const tiffBuffer = realTiffBytes.buffer.slice(realTiffBytes.byteOffset, realTiffBytes.byteOffset + realTiffBytes.byteLength) as ArrayBuffer;
  return new Response(tiffBuffer, { headers: { "content-type": "image/tiff" } });
}

describe("ImageViewerWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("builds image package routes and sends bearer auth", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/data")) {
        return jsonResponse({
          data: {
            data: "https://storage.test/image.json",
            tiff: "https://storage.test/image.tiff",
          },
          status: "completed",
        });
      }
      return jsonResponse({ status: "completed", data: "" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const worker = new ImageViewerWorker();

    await worker.run({ apiBaseUrl: "https://gateway/", session: "session 1", token: "token", type: "imagePackage" });
    await worker.run({ apiBaseUrl: "https://gateway/", session: "session 1", token: "token", type: "imageStatus" });
    await worker.run({ apiBaseUrl: "https://gateway/", session: "session 1", token: "token", type: "imageData" });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://gateway/v1/image/session%201/package", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer token" }),
      method: "POST",
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://gateway/v1/image/session%201/status", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer token" }),
      method: "GET",
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, "https://gateway/v1/image/session%201/data", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer token" }),
      method: "GET",
    }));
  });

  it("accepts completed image data envelope with tiff and data urls", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: {
        data: "https://storage.test/image.json",
        tiff: "https://storage.test/image.tiff",
      },
      status: "completed",
    })));
    const worker = new ImageViewerWorker();

    await expect(worker.run({ apiBaseUrl: "https://gateway", session: "s", token: "t", type: "imageData" })).resolves.toEqual({
      data: {
        data: {
          data: "https://storage.test/image.json",
          tiff: "https://storage.test/image.tiff",
        },
        status: "completed",
      },
      ok: true,
    });
  });

  it("returns image data error envelope to host flow", async () => {
    const payload = { status: "error", data: "failed" };
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(payload)));
    const worker = new ImageViewerWorker();

    await expect(worker.run({ apiBaseUrl: "https://gateway", session: "s", token: "t", type: "imageData" })).resolves.toEqual({
      code: "image_package_error",
      details: payload,
      error: "failed",
      ok: false,
    });
  });

  it("downloads TIFF bytes and parses package metadata from package urls", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "https://storage.test/image.json") return jsonResponse(realPackageMetadata);
      return tiffResponse();
    }));
    const worker = new ImageViewerWorker();

    const result = await worker.run({
      jsonUrl: "https://storage.test/image.json",
      tiffUrl: "https://storage.test/image.tiff",
      token: "t",
      type: "imageDownload",
    });

    expect(result).toEqual({
      data: {
        packageMetadata: realPackageMetadata,
        tiffBytes: expect.anything(),
        tiffType: "image/tiff",
      },
      ok: true,
    });
    expect(realPackageMetadata.pages.length).toBeGreaterThan(0);
    if (!result.ok) throw new Error(result.error);
    const data = result.data as LocalPackage;
    expect(data.tiffBytes.byteLength).toBe(realTiffBytes.length);
  });

  it("rejects downloaded package metadata without pages", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "https://storage.test/image.json") return jsonResponse({ page: [] });
      return tiffResponse();
    }));
    const worker = new ImageViewerWorker();

    await expect(worker.run({
      jsonUrl: "https://storage.test/image.json",
      tiffUrl: "https://storage.test/image.tiff",
      token: "t",
      type: "imageDownload",
    })).resolves.toMatchObject({
      error: "Image package metadata must include pages.",
      ok: false,
    });
  });

  it("validates required command fields and backend error status", async () => {
    const worker = new ImageViewerWorker();
    expect(await worker.run({ apiBaseUrl: "", session: "s", token: "", type: "imageData" })).toMatchObject({ code: "missing_auth_token", ok: false });
    expect(await worker.run({ apiBaseUrl: "", session: "s", token: "t", type: "imageData" })).toMatchObject({ code: "missing_api_base_url", ok: false });
    expect(await worker.run({ apiBaseUrl: "x", session: "", token: "t", type: "imageData" })).toMatchObject({ code: "invalid_session", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error", data: "failed" })));
    expect(await worker.run({ apiBaseUrl: "https://gateway", session: "s", token: "t", type: "imageStatus" })).toMatchObject({
      code: "image_package_error",
      error: "failed",
      ok: false,
    });
  });
});
