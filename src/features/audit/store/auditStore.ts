import { create } from "zustand";
import type { AuditStoreState } from "../type/audit.types";

const initialState = {
  activeSession: null, error: null, refresh: null, refreshId: 0, report: null,
  request: null, retryAttempt: 0, status: "idle",
} satisfies Pick<AuditStoreState, "activeSession" | "error" | "refresh" | "refreshId" | "report" | "request" | "retryAttempt" | "status">;

export const useAuditStore = create<AuditStoreState>()((set) => ({
  ...initialState,
  refreshAudit(session) {
    set(state => ({ refreshId: state.refreshId + 1, refresh: { id: state.refreshId + 1, session } }));
  },
  resetAudit() { set(initialState); },
  setError(error) { set({ error, retryAttempt: 0, status: "error" }); },
  setLoaded(session, report) {
    set(state => state.activeSession !== null && state.activeSession !== session ? state
      : { activeSession: session, error: null, report, retryAttempt: 0, status: "success" });
  },
  setLoading(session, background) {
    const request = crypto.randomUUID();
    set(state => ({ activeSession: session, request, error: null,
      report: state.activeSession === session ? state.report : null,
      retryAttempt: background ? state.retryAttempt : 1, status: background ? state.status : "loading" }));
    return request;
  },
  setRefreshing(session) {
    set(state => ({ activeSession: session, error: null, report: state.activeSession === session ? state.report : null,
      retryAttempt: 1, status: "refreshing" }));
  },
  setRetryAttempt(retryAttempt) { set({ retryAttempt }); },
}));

export const auditStoreApi = useAuditStore;
