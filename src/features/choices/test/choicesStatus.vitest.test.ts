import { afterEach, expect, it, vi } from "vitest";
import { ChoicesWorker } from "../worker/ChoicesWorker";
afterEach(() => vi.unstubAllGlobals());

it("returns interrupted response reads as failures", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, status: 200, headers: new Headers({ "Content-Type": "application/json" }),
    text: async () => { throw new Error("Response interrupted"); },
  }));
  await expect(new ChoicesWorker().run({ type: "load", token: "token", session: "session", config: { apiBaseUrl: "https://gateway" } }))
    .resolves.toMatchObject({ ok: false, error: "Response interrupted" });
});

it("returns invalid completed choices as a parsing failure", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: "completed", data: "invalid" }), {
    headers: { "Content-Type": "application/json" },
  })));
  await expect(new ChoicesWorker().run({ type: "load", token: "token", session: "session", config: { apiBaseUrl: "https://gateway" } }))
    .resolves.toMatchObject({ ok: false, code: "invalid_json" });
});
it.each(["pending", "processing"])("does not fabricate settings from a %s response", async (status) => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status, data: "" }), {
    headers: { "Content-Type": "application/json" },
  })));
  const result = await new ChoicesWorker().run({ type: "load", token: "token", session: "session", config: { apiBaseUrl: "https://gateway.test" } });
  expect(result).toEqual({ ok: true, data: null });
});

it("rejects failure text outside the stored choices JSON contract", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status: "error", data: "Indexing failed" }), {
    headers: { "Content-Type": "application/json" },
  })));
  await expect(new ChoicesWorker().run({ type: "load", token: "token", session: "session", config: { apiBaseUrl: "https://gateway" } }))
    .resolves.toMatchObject({ ok: false, code: "invalid_json" });
});

it.each([
  null,
  { source: "https://storage.test/sub/source.pdf", items: [] },
  { status: "completed" },
  { status: "unknown", data: "" },
  { status: "completed", data: "null" },
  { status: "completed", data: "[]" },
  { status: "completed", data: "{}" },
  { status: "completed", data: JSON.stringify({ source: "https://storage.test/sub/source.pdf", items: [{}] }) },
  { status: "completed", data: JSON.stringify({ source: "https://storage.test/sub/source.pdf", items: [{ service: "Recognition", level: "Level2" }] }) },
  { status: "completed", data: JSON.stringify({ source: "https://storage.test/sub/source.pdf", items: [{ service: "Recognition", level: -1 }] }) },
  { status: "completed", data: JSON.stringify({ source: "https://storage.test/sub/source.pdf", items: [], jurisdiction: 1 }) },
])("rejects successful responses outside the backend choices contract: %j", async payload => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
  })));
  await expect(new ChoicesWorker().run({ type: "load", token: "token", session: "session", config: { apiBaseUrl: "https://gateway" } }))
    .resolves.toMatchObject({ ok: false, code: "validation_error" });
});

it.each([null, "Texas, Harris County", undefined])("reads the documented choices object with jurisdiction %s", async jurisdiction => {
  const choices = { source: "https://storage.test/sub/source.pdf", items: [{ service: "Recognition", level: 2 }], jurisdiction };
  const fetch = vi.fn(async () => new Response(JSON.stringify({ status: "completed", data: JSON.stringify(choices) }), {
    headers: { "Content-Type": "application/json" },
  }));
  vi.stubGlobal("fetch", fetch);
  await expect(new ChoicesWorker().run({ type: "load", token: "token", session: "session/name", config: { apiBaseUrl: "https://gateway/" } }))
    .resolves.toEqual({ ok: true, data: JSON.parse(JSON.stringify(choices)) });
  expect(fetch).toHaveBeenCalledExactlyOnceWith("https://gateway/v1/index/session%2Fname/choices", {
    method: "GET", headers: { Authorization: "Bearer token" },
  });
});
