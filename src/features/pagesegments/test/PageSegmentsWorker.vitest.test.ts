import { afterEach, describe, expect, it, vi } from "vitest";
import { PageSegmentsWorker } from "../worker/PageSegmentsWorker";

function emptyResponse(init: ResponseInit = {}) {
  return new Response("", { status: 200, ...init });
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("PageSegmentsWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds and sends the page-segment update route", async () => {
    const worker = new PageSegmentsWorker();
    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com/",
      pageCode: "page/1",
      segments: ["reference"],
      session: "session/1",
      token: "token",
      type: "updatePageSegments",
    })).toEqual({
      body: JSON.stringify({ segments: ["reference"] }),
      method: "POST",
      url: "https://doc.example.com/v1/reprocess/session%2F1/page/page%2F1/segments",
    });

    const fetchMock = vi.fn(async () => emptyResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: ["reference", "secrets"],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toEqual({ ok: true, data: undefined });

    expect(fetchMock).toHaveBeenCalledWith("https://doc.example.com/v1/reprocess/session-1/page/page-1/segments", {
      body: JSON.stringify({ segments: ["reference", "secrets"] }),
      headers: { Authorization: "Bearer token-1", "Content-Type": "application/json" },
      method: "POST",
    });
  });

  it("parses backend errors and rejects non-empty success bodies", async () => {
    const worker = new PageSegmentsWorker();

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ code: "page_segments_page_not_found", message: "Missing page" }, { status: 404 })));
    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "missing-page",
      segments: [],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({
      code: "page_segments_page_not_found",
      error: "Missing page",
      ok: false,
      status: 404,
    });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ applied: true })));
    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: [],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({ code: "validation_error", ok: false });
  });

  it("handles network failures", async () => {
    const worker = new PageSegmentsWorker();
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));

    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: ["reference"],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({ error: "offline", ok: false });
  });

  it("treats non-json success as validation error", async () => {
    const worker = new PageSegmentsWorker();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200 })));

    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: ["reference"],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({ code: "validation_error", ok: false, status: 200 });
  });

  it("rejects malformed JSON success payloads as validation errors", async () => {
    const worker = new PageSegmentsWorker();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", {
      headers: { "content-type": "application/json" },
      status: 200,
    })));

    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: ["reference"],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({ code: "validation_error", ok: false, status: 200 });
  });

  it("requires HTTP 200 with an empty body", async () => {
    const worker = new PageSegmentsWorker();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(" ", { status: 200 })));

    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: ["reference"],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({ code: "validation_error", ok: false, status: 200 });

    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: ["reference"],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({ code: "validation_error", ok: false, status: 204 });
  });

  it("handles upstream failures including text payload", async () => {
    const worker = new PageSegmentsWorker();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Internal failure", { status: 500 })));

    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      pageCode: "page-1",
      segments: ["reference"],
      session: "session-1",
      token: "token-1",
      type: "updatePageSegments",
    })).resolves.toMatchObject({ error: "Internal failure", ok: false, status: 500 });
  });
});
