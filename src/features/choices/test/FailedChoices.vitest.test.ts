import { afterEach, expect, it, vi } from "vitest";
import { ChoicesWorker } from "../worker/ChoicesWorker";

const command = { type: "load", token: "token", session: "session/1", config: { apiBaseUrl: "https://gateway.test/" } } as const;
const choices = { source: "https://storage.test/sub/source.tif", jurisdiction: null, items: [{ service: "Recognition", level: 3 }] };
afterEach(() => vi.unstubAllGlobals());

it.each(["completed", "error"])("reads saved source and choices for a %s session using the existing authenticated route", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status, data: JSON.stringify(choices) })));
  expect(await new ChoicesWorker().run(command)).toEqual({ ok: true, data: choices });
  expect(fetch).toHaveBeenCalledExactlyOnceWith("https://gateway.test/v1/index/session%2F1/choices", { method: "GET", headers: { Authorization: "Bearer token" } });
});

it.each(["pending", "processing"])("keeps %s choices absent", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status, data: "" })));
  expect(await new ChoicesWorker().run(command)).toEqual({ ok: true, data: null });
});

it.each(["completed", "error"])("reads %s choices without a document URL", async status => {
  for (const source of [undefined, null]) {
    const saved = JSON.parse(JSON.stringify({ ...choices, source }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status, data: JSON.stringify(saved) })));
    expect(await new ChoicesWorker().run(command)).toEqual({ ok: true, data: saved });
  }
});

it.each([4, ""])("rejects an invalid source %s without inventing a path", async source => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "error", data: JSON.stringify({ ...choices, source }) })));
  expect(await new ChoicesWorker().run(command)).toMatchObject({ ok: false, code: "validation_error" });
});

it.each([
  { items: [{}], jurisdiction: null },
  { items: [{ service: "Recognition", level: "3" }], jurisdiction: null },
  { items: [{ service: "Recognition", level: -1 }], jurisdiction: null },
  { items: [], jurisdiction: 3 },
  { jurisdiction: null },
])("still rejects invalid choices when source is absent: %j", async saved => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "completed", data: JSON.stringify(saved) })));
  expect(await new ChoicesWorker().run(command)).toMatchObject({ ok: false, code: "validation_error" });
});

it("propagates an HTTP failure instead of interpreting it as saved choices", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Forbidden", code: "unauthorized" }, { status: 403 })));
  expect(await new ChoicesWorker().run(command)).toMatchObject({ ok: false, error: "Forbidden", status: 403, code: "unauthorized" });
});
