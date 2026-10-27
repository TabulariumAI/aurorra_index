import { loadMetadata } from "./metadataClient";
import type { GenerationInput } from "../../../shared/type/generation.types";
import type { ResourceQuery } from "aurora-core";
import { queueStoreApi } from "../../queue/store/queueStore";

export async function requestResource(request: ResourceQuery, session: string, input?: Pick<GenerationInput, "apiGatewayUrl" | "authToken">): Promise<string | null> {
  if (request.resource !== "metadata_etag") throw new Error(`Unknown resource: ${request.resource}`);
  const generation = queueStoreApi.getState().generation;
  const current = queueStoreApi.getState();
  if (current.session === session && current.etag !== null) return current.etag;
  if (!input) return null;
  const result = await loadMetadata({ ...input, session }, null);
  if (generation !== queueStoreApi.getState().generation) throw { code: "SESSION_CLEARED", error: "Session was cleared." };
  return result.etag;
}
