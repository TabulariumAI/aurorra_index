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
    }).url).toBe("https://doc.example.com/v1/index/session-1/audit");
    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com",
      session: "session 1",
      token: "token",
      type: "auditData",
    }).url).toBe("https://doc.example.com/v1/index/session%201/audit");
  });

  it("sends bearer auth and expected request body", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ gaps: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await new AuditWorker().run({ apiBaseUrl: "https://doc.example.com", session: "session-1", token: "token", type: "auditData" });
    expect(fetchMock).toHaveBeenCalledWith("https://doc.example.com/v1/index/session-1/audit", {
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

  it("returns normalized audit report on success", async () => {
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
    })).toEqual({
      ok: true,
      data: {
        gaps: [{ solution: "ADD", explanation: "alpha", page: "2", owner: "VERIFICATION", timestamp: "2026-01-03T12:00:00Z", segment: "reference" }],
        usage: { costs: ["1", "2"] },
      },
    });
  });

  it("normalizes the complete GapEntry contract from a raw report response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(auditFixture)));

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
    expect(result.data.gaps[0]).toMatchObject({
      solution: "REMOVE",
      explanation: "Remove index",
      owner: "ENRICHMENT",
      segment: "party",
    });
  });

  it("unwraps completed audit data envelopes before normalization", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: JSON.stringify(auditFixture),
      status: "completed",
    })));

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
  });

  it("returns audit envelope errors and invalid data JSON failures", async () => {
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

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: "{",
      status: "completed",
    })));
    expect(await new AuditWorker().run({
      apiBaseUrl: "x",
      session: "session-1",
      token: "token",
      type: "auditData",
    })).toEqual({
      ok: false,
      code: "invalid_json",
      error: "Response data JSON could not be parsed.",
    });
  });
});
