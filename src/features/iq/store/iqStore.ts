import { create } from "zustand";
import type { IqStoreState } from "../type/iq.types";

const initialState = {
  etag: null,
  reportEtag: null,
  removedCodes: new Set<string>(),
  metadataEtag: null,
  verificationEtag: null,
  verificationModel: null,
  activeSession: null,
  error: null,
  report: null,
  retryAttempt: 0,
  status: "idle",
} satisfies Pick<IqStoreState, "etag" | "reportEtag" | "removedCodes" | "metadataEtag" | "verificationEtag" | "verificationModel" | "activeSession" | "error" | "report" | "retryAttempt" | "status">;

export const useIqStore = create<IqStoreState>()((set, get) => ({
  ...initialState,
  generation: 0,
  reportGeneration: 0,
  resetIq() {
    set(state => ({
      ...initialState,
      generation: state.generation + 1,
      reportGeneration: state.reportGeneration + 1,
    }));
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setLoaded(session, report, metadataEtag, verificationEtag, verificationModel, source) {
    set(state => ({ activeSession: session, error: null, report, metadataEtag, verificationEtag, verificationModel,
      etag: source?.etag, reportEtag: source?.reportEtag, removedCodes: new Set(source?.acknowledgements?.map(ack => ack.code)), retryAttempt: 0, status: "success",
      reportGeneration: state.reportGeneration + 1 }));
  },
  setAcknowledged(code, etag) {
    set(state => ({ etag, removedCodes: new Set([...state.removedCodes, code]) }));
  },
  setVerificationModel(session, model) {
    const state = get();
    if (state.activeSession !== session || state.verificationModel?.etag === model.etag) return;
    set({ verificationModel: model });
  },
  setLoading(session, refresh) {
    set(state => ({ activeSession: session, error: null, retryAttempt: 1,
      report: state.activeSession === session ? state.report : null,
      reportGeneration: state.reportGeneration + 1,
      etag: state.activeSession === session ? state.etag : null,
      reportEtag: state.activeSession === session ? state.reportEtag : null,
      removedCodes: state.activeSession === session ? state.removedCodes : new Set<string>(),
      metadataEtag: state.activeSession === session ? state.metadataEtag : null,
      verificationEtag: state.activeSession === session ? state.verificationEtag : null,
      verificationModel: state.activeSession === session ? state.verificationModel : null,
      status: refresh ? "refreshing" : "loading" }));
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const iqStoreApi = useIqStore;
