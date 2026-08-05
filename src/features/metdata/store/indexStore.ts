import { create } from "zustand";
import type { IndexStoreState } from "../type/metadata.types";
import { storeApi } from "../../../store/state/store";

export const useIndexStore = create<IndexStoreState>()((set) => ({
  activeSession: null,
  error: null,
  refresh: null,
  refreshId: 0,
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
    set({
      activeSession: null,
      error: null,
      refresh: null,
      refreshId: 0,
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
    set({ error, status: "error" });
  },
  setLoaded(session) {
    set({ activeSession: session, error: null, status: "success" });
  },
  setLoading(session) {
    set({ activeSession: session, error: null, status: "loading" });
  },
}));

export const indexStoreApi = useIndexStore;
