import type { ResourceRequest } from "aurora-core";
import { queueStoreApi } from "../../queue/store/queueStore";

export async function requestResource(request: ResourceRequest, session: string): Promise<string | null> {
  if (request.resource !== "metadata_etag") throw new Error(`Unknown resource: ${request.resource}`);
  return queueStoreApi.getState().etags[session] ?? null;
}
