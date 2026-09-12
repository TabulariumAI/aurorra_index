import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditWorker } from "../worker/AuditWorker";
import type { AuditWorkerCommand } from "../type/audit.types";

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

const auditFixture = {
  gaps: [
    { solution: "REMOVE", explanation: "Remove index", page: "4", owner: "enrichment", timestamp: "2026-01-04T12:00:00Z", segment: "party" },
    { solution: "ADD", explanation: "Add index", page: "1", owner: "verification", timestamp: "2026-01-03T12:00:00Z", segment: null },
  ],
  usage: { costs: ["$0.9480"] },
};

describe("AuditWorker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds request routes with trimmed base URL and encoded parameters", () => {
    const worker = new AuditWorker();
    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com/",
      session: "session-1",
      token: "token",
      type: "auditData",
    }).url).toBe("https://doc.example.com/v1/metadata/session-1/audit");
    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com",
      session: "session 1",
      token: "token",
      type: "auditData",
    }).url).toBe("https://doc.example.com/v1/metadata/session%201/audit");
  });

  it("sends bearer auth and expected request body", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: "test", status: "error" }));
    vi.stubGlobal("fetch", fetchMock);

    await new AuditWorker().run({ apiBaseUrl: "https://doc.example.com", session: "session-1", token: "token", type: "auditData" });
    expect(fetchMock).toHaveBeenCalledWith("https://doc.example.com/v1/metadata/session-1/audit", {
      body: null,
      headers: { Authorization: "Bearer token" },
      method: "GET",
    });
  });

  it("validates inputs and unknown commands", async () => {
    const worker = new AuditWorker();
    expect(await worker.run({ apiBaseUrl: "x", session: "session-1", token: "", type: "auditData" } as AuditWorkerCommand))
      .toEqual({ ok: false, code: "missing_auth_token", error: "Missing auth token" });
    expect(await worker.run({ apiBaseUrl: "", session: "session-1", token: "token", type: "auditData" } as AuditWorkerCommand))
      .toEqual({ ok: false, code: "missing_api_base_url", error: "Missing service base URL" });
    expect(await worker.run({ apiBaseUrl: "x", session: "   ", token: "token", type: "auditData" } as AuditWorkerCommand))
      .toEqual({ ok: false, code: "invalid_session", error: "Session is missing or invalid." });
    expect(await worker.run({ apiBaseUrl: "x", session: "session", token: "token", type: "bad" as AuditWorkerCommand["type"] }))
      .toEqual({ ok: false, code: "invalid_command", error: "Unknown audit worker command." });
  });

  it("normalizes network and response errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({ ok: false, error: "network down" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", {
      status: 200,
      headers: { "content-type": "text/plain" },
    })));
    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({ ok: false, code: "non_json_response", error: "Response is not JSON.", status: 200 });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", {
      status: 200,
      headers: { "content-type": "application/json" },
    })));
    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({ ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: 200 });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      code: "bad",
      error: "Bad request",
    }, { status: 400 })));
    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({
      ok: false,
      code: "bad",
      details: { code: "bad", error: "Bad request" },
      error: "Bad request",
      status: 400,
    });
  });

  it("rejects a raw audit report response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      gaps: [
        { solution: "ADD", explanation: "alpha", page: "2", owner: "verification", timestamp: "2026-01-03T12:00:00Z", segment: "reference" },
      ],
      usage: {
        costs: [1, 2],
      },
    })));

    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({ ok: false, code: "validation_error", error: "Response is not a valid audit envelope." });
  });

  it("rejects an inline object audit envelope", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: auditFixture, status: "completed" })));

    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({ ok: false, code: "validation_error", error: "Response is not a valid audit envelope." });
  });

  it("downloads and normalizes the audit Blob from the completed SAS URL", async () => {
    const sasUrl = "https://storage.test/subscription/session/audit.json?sig=token";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: sasUrl, status: "completed" }))
      .mockResolvedValueOnce(jsonResponse(auditFixture));
    vi.stubGlobal("fetch", fetchMock);

    const result = await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.gaps).toHaveLength(2);
    expect(result.data.usage).toEqual({ costs: ["$0.9480"] });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "x/v1/metadata/session-1/audit", {
      body: null,
      headers: { Authorization: "Bearer token" },
      method: "GET",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, sasUrl);
  });

  it("returns the Blob download failure without normalizing it as an empty report", async () => {
    const sasUrl = "https://storage.test/subscription/session/audit.json?sig=token";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: sasUrl, status: "completed" }))
      .mockResolvedValueOnce(jsonResponse({ error: "SAS denied" }, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({
      ok: false,
      details: { error: "SAS denied" },
      error: "SAS denied",
      status: 403,
    });
  });

  it("returns the audit Blob network failure", async () => {
    const sasUrl = "https://storage.test/subscription/session/audit.json?sig=token";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: sasUrl, status: "completed" }))
      .mockRejectedValueOnce(new Error("Blob unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({ ok: false, error: "Blob unavailable" });
  });

  it("returns invalid JSON from the audit Blob as a retrieval failure", async () => {
    const sasUrl = "https://storage.test/subscription/session/audit.json?sig=token";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: sasUrl, status: "completed" }))
      .mockResolvedValueOnce(new Response("{", {
        status: 200,
        headers: { "content-type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({
      ok: false,
      code: "invalid_json",
      error: "Response JSON could not be parsed.",
      status: 200,
    });
  });

  it("returns audit envelope errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: "backend audit failure",
      status: "error",
    })));
    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({
      ok: false,
      code: "audit_error",
      details: { data: "backend audit failure", status: "error" },
      error: "backend audit failure",
    });
  });

  it("returns incomplete audit status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "processing" })));

    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({
      ok: false,
      code: "audit_not_completed",
      details: { data: "", status: "processing" },
      error: "processing",
    });
  });
});
