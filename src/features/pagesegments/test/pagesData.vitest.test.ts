import { afterEach, expect, it, vi } from "vitest";
import { PageSegmentsWorker } from "../worker/PageSegmentsWorker";

afterEach(() => vi.unstubAllGlobals());

it("downloads pages from the content endpoint and retains the pages etag", async () => {
  const pages = { num_of_pages: 1, recordables: [{ code: "page-1", name: "1", class: "document", segments: ["party"] }] };
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ status: "completed", data: "https://blob/pages.json?sig=pages", etag: "pages-etag" }), { headers: { "content-type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify(pages), { headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetch);
  const result = await new PageSegmentsWorker().run({ apiBaseUrl: "https://gateway", session: "session-1", token: "token", type: "pagesData" });
  expect(fetch.mock.calls[0][0]).toBe("https://gateway/v1/content/session-1/pages");
  expect(fetch.mock.calls[1][0]).toBe("https://blob/pages.json?sig=pages");
  expect(result).toMatchObject({ ok: true, data: pages, etag: "pages-etag" });
});

it.each(["pending", "processing", "error"])("does not download an incomplete %s pages export", async (status) => {
  const fetch = vi.fn(async () => new Response(JSON.stringify({ status, data: "" }), { headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetch);
  expect(await new PageSegmentsWorker().run({ apiBaseUrl: "https://gateway", session: "session-1", token: "token", type: "pagesData" })).toMatchObject({ ok: false });
  expect(fetch).toHaveBeenCalledTimes(1);
});
