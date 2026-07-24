import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddIndexWorkerCommand } from "../type/addIndex.types";
import { AddIndexWorker } from "../worker/AddIndexWorker";

function command(overrides: Partial<AddIndexWorkerCommand> = {}): AddIndexWorkerCommand {
  return {
    apiBaseUrl: "https://gateway.example.com",
    aspect: "party",
    session: "session-1",
    source: "P 3  Selected context",
    token: "token-1",
    type: "addIndex",
    value: "Selected value",
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("AddIndexWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds and sends the Add Index request with bearer auth", async () => {
    const worker = new AddIndexWorker();
    expect(worker.buildRequest(command({
      apiBaseUrl: "https://gateway.example.com/",
      session: "session/1",
    }))).toEqual({
      body: JSON.stringify({
        value: "Selected value",
        source: "P 3  Selected context",
        aspect: "party",
      }),
      method: "POST",
      url: "https://gateway.example.com/v1/refine/session%2F1/add/index",
    });
    const fetchMock = vi.fn(async () => jsonResponse({ accepted: true, description: "Index added." }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(worker.run(command())).resolves.toEqual({
      data: { accepted: true, description: "Index added." },
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledWith("https://gateway.example.com/v1/refine/session-1/add/index", {
      body: JSON.stringify({
        value: "Selected value",
        source: "P 3  Selected context",
        aspect: "party",
      }),
      headers: {
        Authorization: "Bearer token-1",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("returns the service description when the index is not accepted", async () => {
    const worker = new AddIndexWorker();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      accepted: false,
      description: "Index already exists.",
    })));

    await expect(worker.run(command())).resolves.toEqual({
      code: "index_not_added",
      details: {
        accepted: false,
        description: "Index already exists.",
      },
      error: "Index already exists.",
      ok: false,
      status: 200,
    });
  });

  it("preserves backend and network errors", async () => {
    const worker = new AddIndexWorker();
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
    const worker = new AddIndexWorker();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ accepted: true })));
    await expect(worker.run(command())).resolves.toMatchObject({
      code: "validation_error",
      ok: false,
      status: 200,
    });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      accepted: true,
      description: "Index added.",
    }, { status: 201 })));
    await expect(worker.run(command())).resolves.toEqual({
      code: "validation_error",
      error: "Add Index response status must be 200.",
      ok: false,
      status: 201,
    });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", {
      headers: { "content-type": "application/json" },
      status: 200,
    })));
    await expect(worker.run(command())).resolves.toEqual({
      code: "invalid_json",
      error: "Response JSON could not be parsed.",
      ok: false,
      status: 200,
    });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("Index added.", { status: 200 })));
    await expect(worker.run(command())).resolves.toEqual({
      code: "non_json_response",
      error: "Response is not JSON.",
      ok: false,
      status: 200,
    });
  });

  it("validates required command fields before fetching", async () => {
    const worker = new AddIndexWorker();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(worker.run(command({ token: "" }))).resolves.toMatchObject({ code: "missing_auth_token", ok: false });
    await expect(worker.run(command({ apiBaseUrl: "" }))).resolves.toMatchObject({ code: "missing_api_base_url", ok: false });
    await expect(worker.run(command({ session: "" }))).resolves.toMatchObject({ code: "invalid_session", ok: false });
    await expect(worker.run(command({ value: "" }))).resolves.toMatchObject({ code: "invalid_value", ok: false });
    await expect(worker.run(command({ source: null as unknown as string }))).resolves.toMatchObject({ code: "invalid_source", ok: false });
    await expect(worker.run(command({ aspect: "" }))).resolves.toMatchObject({ code: "invalid_aspect", ok: false });
    await expect(worker.run(command({ type: "unknown" as "addIndex" }))).resolves.toMatchObject({ code: "invalid_command", ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
