import { afterEach, expect, it, vi } from "vitest";
import { IqWorker } from "../../../features/iq/worker/IqWorker";
import { AuditWorker } from "../../../features/audit/worker/AuditWorker";
import { MetadataWorker } from "../../../features/metdataview/worker/MetadataWorker";
import { ChoicesWorker } from "../../../features/choices/worker/ChoicesWorker";
import { PageSegmentsWorker } from "../../../features/pagesegments/worker/PageSegmentsWorker";
import { ImageViewerWorker } from "../../../features/imageviewer/worker/ImageWorker";

const command = { apiBaseUrl: "https://gateway.test", session: "s", token: "t" };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

for (const status of [429, 503]) {
  for (const body of ['{"error":"Unavailable"}', 'unreadable']) {
    it.each([
      ["IQ", () => new IqWorker().run({ ...command, type: "iqData", etag: null })],
      ["Audit", () => new AuditWorker().run({ ...command, type: "auditData" })],
      ["Metadata", () => new MetadataWorker().run({ ...command, type: "indexData" })],
      ["Choices", () => new ChoicesWorker().run({ ...command, config: { apiBaseUrl: command.apiBaseUrl }, type: "load" })],
      ["Pages", () => new PageSegmentsWorker().run({ ...command, type: "pagesData" })],
      ["Image", () => new ImageViewerWorker().run({ ...command, type: "imagePackage", refresh: false })],
    ] as const)(`%s retains ${status} retry information with body ${body} without replay`, async (_name, request) => {
      const fetch = vi.fn().mockResolvedValue(new Response(body, { status, headers: { "Content-Type": "application/json", "Retry-After": "30" } }));
      vi.stubGlobal("fetch", fetch);
      await expect(request()).resolves.toMatchObject({ ok: false, status, retryAfter: "30", retryAt: expect.any(Number), error: expect.stringContaining("Retry after ") });
      expect(fetch).toHaveBeenCalledOnce();
    });
  }
}
