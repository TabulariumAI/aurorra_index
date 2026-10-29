import { useIqStore } from "../store/iqStore";
import { useQueueStore } from "../../queue/store/queueStore";

export function useIqRefresh(): boolean {
  const source = useIqStore(state => state.metadataEtag);
  const session = useIqStore(state => state.activeSession);
  const current = useQueueStore(state => state.session === session ? state.etag : undefined);
  return source !== null && current !== undefined && source !== current;
}
