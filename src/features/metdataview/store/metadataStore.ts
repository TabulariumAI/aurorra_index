import { create } from "zustand";
import type { MetdataStoreState } from "../type/metadataView.types";
import { storeApi } from "../../../store/state/store";

export const useIndexStore = create<MetdataStoreState>()((set, get) => ({
  activeSession: null,
  error: null,
  refresh: null,
  refreshId: 0,
  retryAttempt: 0,
  status: "idle",
  invalidateSession(session) {
    storeApi.getState().removeJSON(session);
    set((state) => {
      return {
        error: state.activeSession === session ? null : state.error,
        status: state.activeSession === session ? "idle" : state.status,
      };
    });
  },
  resetMetadata() {
    storeApi.getState().resetJSON();
    get().resetView();
  },
  resetView() {
    set({
      activeSession: null,
      error: null,
      refresh: null,
      refreshId: 0,
      retryAttempt: 0,
      status: "idle",
    });
  },
  refreshMetadata(session, segment) {
    set((state) => {
      const id = state.refreshId + 1;
      return {
        refresh: { id, segment, session },
        refreshId: id,
      };
    });
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setLoaded(session) {
    set({ activeSession: session, error: null, retryAttempt: 0, status: "success" });
  },
  setLoading(session) {
    set({ activeSession: session, error: null, retryAttempt: 1, status: "loading" });
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const indexStoreApi = useIndexStore;
