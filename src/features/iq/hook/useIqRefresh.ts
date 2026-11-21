import { useIqStore } from "../store/iqStore";
import { useQueueStore } from "../../queue/store/queueStore";

export function useIqRefresh(): boolean {
  const etag = useIqStore(state => state.etag);
  const reportEtag = useIqStore(state => state.reportEtag);
  const source = useIqStore(state => state.metadataEtag);
  const modelSource = useIqStore(state => state.verificationEtag);
  const modelCurrent = useIqStore(state => state.verificationModel?.etag);
  const session = useIqStore(state => state.activeSession);
  const current = useQueueStore(state => state.session === session ? state.etag : undefined);
  return typeof etag === "string" && typeof reportEtag === "string" && etag !== reportEtag
    || typeof source === "string" && current !== undefined && source !== current
    || typeof modelSource === "string" && typeof modelCurrent === "string" && modelSource !== modelCurrent;
}
