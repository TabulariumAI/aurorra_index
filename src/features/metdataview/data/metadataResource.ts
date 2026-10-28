import { indexStoreApi } from "../store/metadataStore";
import type { SessionChoices } from "../../choices/type/choices.types";
import type { ResourceQuery } from "aurora-core";
import { queueStoreApi } from "../../queue/store/queueStore";

export function requestResource(request: ResourceQuery & { resource: "metadata_etag" }, session: string): Promise<string | null>;
export function requestResource(request: ResourceQuery & { resource: "session_choices" }, session: string): Promise<SessionChoices | null>;
export function requestResource(request: ResourceQuery, session: string): Promise<string | SessionChoices | null>;
export async function requestResource(request: ResourceQuery, session: string): Promise<string | SessionChoices | null> {
  if (request.resource === "session_choices") {
    const state = indexStoreApi.getState();
    return queueStoreApi.getState().session === session ? structuredClone(state.choices) : null;
  }
  if (request.resource !== "metadata_etag") throw new Error(`Unknown resource: ${request.resource}`);
  const current = queueStoreApi.getState();
  if (current.session === session && current.etag !== null) return current.etag;
  return null;
}
