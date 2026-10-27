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
it("retrieves metadata for generation without retaining another session", async () => {
  const input = { apiGatewayUrl: "https://gateway", authToken: "token" };
  metadata.loadMetadata.mockResolvedValueOnce({ data: {}, etag: "retrieved" });
  await expect(requestResource({ resource: "metadata_etag" }, "requested", input)).resolves.toBe("retrieved");
  expect(metadata.loadMetadata).toHaveBeenCalledExactlyOnceWith({ ...input, session: "requested" }, null);
});
it("accepts a retrieved result with no ETag", async () => {
  metadata.loadMetadata.mockResolvedValueOnce({ data: {}, etag: null });
  await expect(requestResource({ resource: "metadata_etag" }, "requested", { apiGatewayUrl: "https://gateway", authToken: "token" })).resolves.toBeNull();
});
it("rejects a resource that Index does not own", async () => {
  await expect(requestResource({ resource: "aspects" }, "session")).rejects.toThrow("Unknown resource: aspects");
});
it("propagates actual metadata retrieval failures", async () => {
  const error = new Error("Metadata unavailable");
  metadata.loadMetadata.mockRejectedValueOnce(error);
  await expect(requestResource({ resource: "metadata_etag" }, "requested", { apiGatewayUrl: "https://gateway", authToken: "token" })).rejects.toBe(error);
});
it("rejects work invalidated by an exit during metadata retrieval", async () => {
  let finish!: (value: { data: {}; etag: string }) => void;
  metadata.loadMetadata.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const pending = expect(requestResource({ resource: "metadata_etag" }, "requested", { apiGatewayUrl: "https://gateway", authToken: "token" })).rejects.toMatchObject({ code: "SESSION_CLEARED" });
  queueStoreApi.getState().reset();
  finish({ data: {}, etag: "old" });
  await pending;
});
