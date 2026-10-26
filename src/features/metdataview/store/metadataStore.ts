import { create } from "zustand";
import type { MetdataStoreState } from "../type/metadataView.types";
import { storeApi } from "../../../store/state/store";

export const useIndexStore = create<MetdataStoreState>()((set, get) => ({
  activeSession: null,
  openSegment: null,
  error: null,
  pageErrors: {},
  pageRequests: {},
  refresh: null,
  refreshId: 0,
  retryAttempt: 0,
  status: "idle",
  getSegment(pageSegment) {
    const segment = get().openSegment;
    if (segment) return segment;
    set({ openSegment: pageSegment });
    return pageSegment;
  },
  invalidateSession(session) {
    storeApi.getState().removeJSON(session);
    set((state) => {
      const pageErrors = { ...state.pageErrors };
      const pageRequests = { ...state.pageRequests };
      delete pageErrors[session];
      delete pageRequests[session];
      return {
        pageErrors,
        pageRequests,
        error: state.activeSession === session ? null : state.error,
        status: state.activeSession === session ? "idle" : state.status,
      };
    });
  },
  resetMetadata() {
    storeApi.getState().resetJSON();
    set({ pageErrors: {} });
    get().resetView();
  },
  resetView() {
    set({
      activeSession: null,
      openSegment: null,
      error: null,
      pageRequests: {},
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
  setPageError(session, error) {
    set(state => {
      const pageErrors = { ...state.pageErrors };
      if (error) pageErrors[session] = error;
      else delete pageErrors[session];
      return { pageErrors };
    });
  },
  setPageLoading(session) {
    const request = crypto.randomUUID();
    set(state => ({ pageRequests: { ...state.pageRequests, [session]: request } }));
    return request;
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
