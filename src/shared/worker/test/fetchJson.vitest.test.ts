import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "../fetchJson";

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("fetchJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ value: 1 })));

    await expect(fetchJson("https://storage.test/data.json")).resolves.toEqual({
      data: { value: 1 },
      ok: true,
    });
  });

  it("returns network failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("Blob unavailable");
    }));

    await expect(fetchJson("https://storage.test/data.json")).resolves.toEqual({
      error: "Blob unavailable",
      ok: false,
    });
  });

  it("returns HTTP error details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ code: "denied", error: "SAS denied" }, { status: 403 })));

    await expect(fetchJson("https://storage.test/data.json")).resolves.toEqual({
      code: "denied",
      details: { code: "denied", error: "SAS denied" },
      error: "SAS denied",
      ok: false,
      status: 403,
    });
  });

  it("returns invalid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", {
      headers: { "content-type": "application/json" },
      status: 200,
    })));

    await expect(fetchJson("https://storage.test/data.json")).resolves.toEqual({
      code: "invalid_json",
      error: "Response JSON could not be parsed.",
      ok: false,
      status: 200,
    });
  });
});
