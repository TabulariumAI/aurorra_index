import { afterEach, describe, expect, it, vi } from "vitest";
import type { MetdataWorkerCommand } from "../../metdataview/type/metadataView.types";
import { IndexWorker } from "../../metdataview/worker/metdataWorker";

function command(overrides: Partial<{ apiBaseUrl: string; session: string; token: string; label: string; aspect: string; value: string; explanation: string; segment: string }> = {}): Extract<MetdataWorkerCommand, { type: "patchIndex" }> {
  const { label = "party", aspect = "party", value = "Selected value", explanation = "P 3  Selected context", ...runtime } = overrides;
  return {
    apiBaseUrl: "https://gateway.example.com", segment: "party", session: "session-1", token: "token-1", type: "patchIndex", ...runtime,
    change: { action: "add", explanation, new_index_label: label, new_index_aspect: aspect, new_index_value: value,
      new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null },
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("IndexWorker", () => {
  it.each([null, "false", 1])("rejects non-boolean enrichment %j before fetching", async (allow_enrichment) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const input = command();
    Object.assign(input.change, { allow_enrichment });
    await expect(new IndexWorker().run(input)).resolves.toMatchObject({ ok: false, code: "invalid_enrichment" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([["1", "Notary source\nSecond line"], ["", ""], [null, null]])("sends page %s and source separately", (page, source) => {
    const input = command({ explanation: "Index created by user." });
    Object.assign(input.change, { new_index_page: page, new_index_source: source });
    const body = JSON.parse(new IndexWorker().buildRequest(input).body!);
    expect(body).toMatchObject({ new_index_page: page, new_index_source: source, explanation: "Index created by user." });
  });

  it.each(["page", "source"])("rejects a non-string %s before fetching", async (field) => {
    const input = command();
    Object.assign(input.change, { [`new_index_${field}`]: 7 });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(new IndexWorker().run(input)).resolves.toMatchObject({ ok: false, code: `invalid_${field}` });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds and sends the Add Index request with bearer auth", async () => {
    const worker = new IndexWorker();
    expect(worker.buildRequest(command({
      apiBaseUrl: "https://gateway.example.com/",
      session: "session/1",
    }))).toEqual({
      body: JSON.stringify({
        segment: "party",
        explanation: "P 3  Selected context",
        new_index_label: "party",
        new_index_aspect: "party",
        new_index_value: "Selected value",
        allow_enrichment: false,
      }),
      method: "POST",
      url: "https://gateway.example.com/v1/refine/session%2F1/patch/add",
    });
    const fetchMock = vi.fn(async () => jsonResponse({ data: "", status: "processing", version: 3 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(worker.run(command())).resolves.toEqual({
      data: { data: "", status: "processing", version: 3 },
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledWith("https://gateway.example.com/v1/refine/session-1/patch/add", {
      body: JSON.stringify({
        segment: "party",
        explanation: "P 3  Selected context",
        new_index_label: "party",
        new_index_aspect: "party",
        new_index_value: "Selected value",
        allow_enrichment: false,
      }),
      headers: {
        Authorization: "Bearer token-1",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    await expect(worker.run(command({ label: "" }))).resolves.toEqual({
      data: { data: "", status: "processing", version: 3 },
      ok: true,
    });
    expect(fetchMock).toHaveBeenLastCalledWith("https://gateway.example.com/v1/refine/session-1/patch/add", {
      body: JSON.stringify({
        segment: "party",
        explanation: "P 3  Selected context",
        new_index_label: "",
        new_index_aspect: "party",
        new_index_value: "Selected value",
        allow_enrichment: false,
      }),
      headers: {
        Authorization: "Bearer token-1",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("builds and sends patch status requests", async () => {
    const worker = new IndexWorker();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "completed", version: 3 })));

    await expect(worker.run({ apiBaseUrl: "https://gateway.example.com", session: "session-1", token: "token-1", type: "patchStatus", version: 3 })).resolves.toEqual({
      data: { data: "", status: "completed", version: 3 }, ok: true,
    });
    expect(fetch).toHaveBeenCalledWith("https://gateway.example.com/v1/refine/session-1/patch/status/3", {
      body: null,
      headers: { Authorization: "Bearer token-1" },
      method: "GET",
    });
  });

  it("preserves backend and network errors", async () => {
    const worker = new IndexWorker();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      code: "refine_add_index_failed",
      message: "Failed to add index",
    }, { status: 500 })));

    await expect(worker.run(command())).resolves.toMatchObject({
      code: "refine_add_index_failed",
      error: "Failed to add index",
      ok: false,
      status: 500,
    });

    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    await expect(worker.run(command())).resolves.toEqual({ error: "offline", ok: false });
  });

  it("rejects invalid success responses", async () => {
    const worker = new IndexWorker();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "unknown", version: 3 })));
    await expect(worker.run(command())).resolves.toMatchObject({
      code: "validation_error",
      ok: false,
    });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "processing", version: 3 }, { status: 201 })));
    await expect(worker.run(command())).resolves.toEqual({
      code: "validation_error",
      error: "Mutation response status must be 200.",
      ok: false,
      status: 201,
    });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", {
      headers: { "content-type": "application/json" },
      status: 200,
    })));
    await expect(worker.run(command())).resolves.toEqual({
      code: "validation_error",
      error: "Response JSON could not be parsed.",
      ok: false,
      status: 200,
    });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("Index added.", { status: 200 })));
    await expect(worker.run(command())).resolves.toEqual({
      code: "validation_error",
      error: "Response is not JSON.",
      ok: false,
      status: 200,
    });
  });

  it("validates required command fields before fetching", async () => {
    const worker = new IndexWorker();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(worker.run(command({ token: "" }))).resolves.toMatchObject({ code: "missing_auth_token", ok: false });
    await expect(worker.run(command({ apiBaseUrl: "" }))).resolves.toMatchObject({ code: "missing_api_base_url", ok: false });
    await expect(worker.run(command({ session: "" }))).resolves.toMatchObject({ code: "invalid_session", ok: false });
    await expect(worker.run(command({ value: "" }))).resolves.toMatchObject({ code: "invalid_value", ok: false });
    await expect(worker.run(command({ explanation: null as unknown as string }))).resolves.toMatchObject({ code: "invalid_explanation", ok: false });
    await expect(worker.run(command({ segment: "" }))).resolves.toMatchObject({ code: "invalid_segment", ok: false });
    await expect(worker.run(command({ aspect: "" }))).resolves.toMatchObject({ code: "invalid_aspect", ok: false });
    await expect(worker.run({ ...command(), type: "unknown" } as unknown as MetdataWorkerCommand)).resolves.toMatchObject({ code: "invalid_command", ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
