import type { QueueHubProvider } from "aurora-core";
import { queueStoreApi } from "./store/queueStore";

export const auroraIndexQueueHub: QueueHubProvider = {
  getSnapshot: () => queueStoreApi.getState().queues,
  subscribe: (listener) => queueStoreApi.subscribe(listener),
};
