import type { ResourceQuery } from "aurora-core";
import { queueStoreApi } from "../../queue/store/queueStore";
import { indexStoreApi } from "../store/metadataStore";

export async function requestResource(request: ResourceQuery, session: string): Promise<string> {
  if (request.resource !== "metadata_etag") throw new Error(`Unknown resource: ${request.resource}`);
  const generation = queueStoreApi.getState().generation;
  let activeSession = indexStoreApi.getState().activeSession;
  return new Promise((resolve, reject) => {
    const settle = () => {
      const queue = queueStoreApi.getState();
      const metadata = indexStoreApi.getState();
      const error = queue.generation !== generation || activeSession === session && metadata.activeSession !== session
        ? { code: "SESSION_CLEARED", error: "Session was cleared." }
        : metadata.activeSession === session && metadata.status === "error" ? metadata.error : null;
      activeSession = metadata.activeSession;
      if (!error && !queue.etags[session]) return;
      unsubscribeQueue();
      unsubscribeMetadata();
      if (error) reject(error);
      else resolve(queue.etags[session]);
    };
    const unsubscribeQueue = queueStoreApi.subscribe(settle);
    const unsubscribeMetadata = indexStoreApi.subscribe(settle);
    settle();
  });
}
