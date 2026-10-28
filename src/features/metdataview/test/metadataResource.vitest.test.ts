import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { requestResource } from "../data/metadataResource";
import { queueStoreApi } from "../../queue/store/queueStore";
import { indexStoreApi } from "../store/metadataStore";
const metadata = vi.hoisted(() => ({ loadMetadata: vi.fn() }));
vi.mock("../data/metadataClient", () => metadata);
beforeEach(() => { indexStoreApi.getState().resetMetadata(); metadata.loadMetadata.mockReset(); });
afterEach(() => vi.restoreAllMocks());
it("provides only the current metadata ETag", async () => {
  queueStoreApi.getState().setEtag("current", "current-version");
  await expect(requestResource({ resource: "metadata_etag" }, "current")).resolves.toBe("current-version");
  await expect(requestResource({ resource: "metadata_etag" }, "other")).resolves.toBeNull();
});
it("does not subscribe or wait when no ETag exists", async () => {
  const subscribe = vi.spyOn(queueStoreApi, "subscribe");
  await expect(requestResource({ resource: "metadata_etag" }, "current")).resolves.toBeNull();
  expect(subscribe).not.toHaveBeenCalled();
});
it("does not retrieve metadata when the current ETag is absent", async () => {
  await expect(requestResource({ resource: "metadata_etag" }, "requested")).resolves.toBeNull();
  expect(metadata.loadMetadata).not.toHaveBeenCalled();
});
it("rejects a resource that Index does not own", async () => {
  await expect(requestResource({ resource: "aspects" }, "session")).rejects.toThrow("Unknown resource: aspects");
});
