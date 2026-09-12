import { afterEach, describe, expect, it, vi } from "vitest";
import { auroraIndexQueueHub } from "../queueHub";
import { queueStoreApi } from "../store/queueStore";

afterEach(() => queueStoreApi.getState().reset());

describe("auroraIndexQueueHub", () => {
  it("provides the queue store snapshot and subscriptions", () => {
    const listener = vi.fn();
    const unsubscribe = auroraIndexQueueHub.subscribe(listener);
    const notice = { id: "index", session: "session-1", batch: null, pending: 1, failed: 0, completed: 0 };

    queueStoreApi.setState({ queues: [notice] });

    expect(auroraIndexQueueHub.getSnapshot()).toEqual([notice]);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
