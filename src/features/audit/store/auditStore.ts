import { create } from "zustand";
import type { AuditStoreState } from "../type/audit.types";

const initialState = {
  activeSession: null,
  error: null,
  refresh: null,
  refreshId: 0,
  report: null,
  retryAttempt: 0,
  status: "idle",
} satisfies Pick<AuditStoreState, "activeSession" | "error" | "refresh" | "refreshId" | "report" | "retryAttempt" | "status">;

export const useAuditStore = create<AuditStoreState>()((set) => ({
  ...initialState,
  refreshAudit(session) {
    set((state) => {
      const id = state.refreshId + 1;
      return {
        refresh: { id, session },
        refreshId: id,
      };
    });
  },
  resetAudit() {
    set({
      activeSession: null,
      error: null,
      refresh: null,
      refreshId: 0,
      report: null,
      retryAttempt: 0,
      status: "idle",
    });
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setLoaded(session, report) {
    set({ activeSession: session, error: null, report, retryAttempt: 0, status: "success" });
  },
  setLoading(session) {
    set((state) => ({
      activeSession: session,
      error: null,
      report: state.report,
      retryAttempt: 1,
      status: "loading",
    }));
  },
  setRefreshing(session) {
    set((state) => ({
      activeSession: session,
      error: null,
      report: state.report,
      retryAttempt: 1,
      status: "refreshing",
    }));
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const auditStoreApi = useAuditStore;
