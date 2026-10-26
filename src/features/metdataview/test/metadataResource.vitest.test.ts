import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { requestResource } from "../data/metadataResource";
import { queueStoreApi } from "../../queue/store/queueStore";
import { indexStoreApi } from "../store/metadataStore";

const metadata = vi.hoisted(() => ({ loadMetadata: vi.fn() }));
vi.mock("../data/metadataClient", () => metadata);

beforeEach(() => { indexStoreApi.getState().resetView(); metadata.loadMetadata.mockReset(); });
afterEach(() => { queueStoreApi.getState().reset(); vi.restoreAllMocks(); });

it("provides the locally stored metadata etag for the requested session", async () => {
  queueStoreApi.setState({ etags: { first: "first-etag", second: "second-etag" } });
  await expect(requestResource({ resource: "metadata_etag" }, "first")).resolves.toBe("first-etag");
  await expect(requestResource({ resource: "metadata_etag" }, "second")).resolves.toBe("second-etag");
});

it("waits for its session's eTag and releases both subscriptions when ready", async () => {
  const queueUnsubscribe = vi.fn();
  const indexUnsubscribe = vi.fn();
  const queueSubscribe = queueStoreApi.subscribe;
  const indexSubscribe = indexStoreApi.subscribe;
  vi.spyOn(queueStoreApi, "subscribe").mockImplementation(listener => {
    const unsubscribe = queueSubscribe(listener);
    return () => { queueUnsubscribe(); unsubscribe(); };
  });
  vi.spyOn(indexStoreApi, "subscribe").mockImplementation(listener => {
    const unsubscribe = indexSubscribe(listener);
    return () => { indexUnsubscribe(); unsubscribe(); };
  });
  const ready = vi.fn();
  const pending = requestResource({ resource: "metadata_etag" }, "waiting").then(ready);
  queueStoreApi.getState().setEtag("another", "other-etag");
  await Promise.resolve();
  expect(ready).not.toHaveBeenCalled();
  queueStoreApi.getState().setEtag("waiting", "ready-etag");
  await pending;
  expect(ready).toHaveBeenCalledExactlyOnceWith("ready-etag");
  expect(queueUnsubscribe).toHaveBeenCalledOnce();
  expect(indexUnsubscribe).toHaveBeenCalledOnce();
});

it.each([false, true])("rejects the owning session's metadata failure; already failed=%s", async failed => {
  const error = { error: "Metadata failed", code: "metadata_failed", status: 503, details: { session: "waiting" } };
  indexStoreApi.getState().setLoading("waiting");
  if (failed) indexStoreApi.getState().setError(error);
  const pending = expect(requestResource({ resource: "metadata_etag" }, "waiting")).rejects.toEqual(error);
  if (!failed) indexStoreApi.getState().setError(error);
  await pending;
});

it("rejects an outstanding wait when the queue owner resets", async () => {
  const pending = expect(requestResource({ resource: "metadata_etag" }, "waiting")).rejects.toMatchObject({ code: "SESSION_CLEARED" });
  queueStoreApi.getState().reset();
  await pending;
});

it("releases a wait when its active metadata session is replaced", async () => {
  indexStoreApi.getState().setLoading("waiting");
  const pending = expect(requestResource({ resource: "metadata_etag" }, "waiting")).rejects.toMatchObject({ code: "SESSION_CLEARED" });
  indexStoreApi.getState().setLoading("next-session");
  await pending;
});

it("rejects a resource that Index does not own", async () => {
  await expect(requestResource({ resource: "aspects" }, "session")).rejects.toThrow("Unknown resource: aspects");
});


it("loads an uncached metadata etag through its owner", async () => {
  const input = { apiGatewayUrl: "https://gateway", authToken: "token", session: "uncached" };
  metadata.loadMetadata.mockImplementationOnce(async () => queueStoreApi.getState().setEtag(input.session, "loaded-etag"));
  await expect(requestResource({ resource: "metadata_etag" }, input.session, input)).resolves.toBe("loaded-etag");
  expect(metadata.loadMetadata).toHaveBeenCalledExactlyOnceWith(input, null);
});

it("propagates metadata retrieval failure without adding subscriptions", async () => {
  const input = { apiGatewayUrl: "https://gateway", authToken: "token", session: "uncached" };
  const error = new Error("Metadata unavailable");
  metadata.loadMetadata.mockRejectedValueOnce(error);
  const subscribe = vi.spyOn(queueStoreApi, "subscribe");
  await expect(requestResource({ resource: "metadata_etag" }, input.session, input)).rejects.toBe(error);
  expect(subscribe).not.toHaveBeenCalled();
});

it("rejects a retrieved result missing its metadata etag", async () => {
  const input = { apiGatewayUrl: "https://gateway", authToken: "token", session: "uncached" };
  metadata.loadMetadata.mockResolvedValueOnce({});
  await expect(requestResource({ resource: "metadata_etag" }, input.session, input)).rejects.toMatchObject({ code: "metadata_version_missing" });
});
