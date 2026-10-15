import { afterEach, expect, it } from "vitest";
import { requestResource } from "../data/metadataResource";
import { queueStoreApi } from "../../queue/store/queueStore";

afterEach(() => queueStoreApi.getState().reset());

it("provides the locally stored metadata etag for the requested session", async () => {
  queueStoreApi.setState({ etags: { first: "first-etag", second: "second-etag" } });
  await expect(requestResource({ resource: "metadata_etag" }, "first")).resolves.toBe("first-etag");
  await expect(requestResource({ resource: "metadata_etag" }, "second")).resolves.toBe("second-etag");
  await expect(requestResource({ resource: "metadata_etag" }, "unloaded")).resolves.toBeNull();
});

it("rejects a resource that Index does not own", async () => {
  await expect(requestResource({ resource: "aspects" }, "session")).rejects.toThrow("Unknown resource: aspects");
});
