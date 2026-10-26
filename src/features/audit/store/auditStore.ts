import { create } from "zustand";
import type { AuditStoreState } from "../type/audit.types";

const initialState = {
  activeSession: null,
  error: null,
  refresh: null,
  refreshId: 0,
  report: null,
  reportsBySession: {},
  requests: {},
  retryAttempt: 0,
  status: "idle",
} satisfies Pick<AuditStoreState, "activeSession" | "error" | "refresh" | "refreshId" | "report" | "reportsBySession" | "requests" | "retryAttempt" | "status">;

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
      reportsBySession: {},
      requests: {},
      retryAttempt: 0,
      status: "idle",
    });
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setLoaded(session, report) {
    set(state => ({
      reportsBySession: { ...state.reportsBySession, [session]: report },
      ...(state.activeSession === null || state.activeSession === session
        ? { activeSession: session, error: null, report, retryAttempt: 0, status: "success" as const }
        : {}),
    }));
  },
  setLoading(session, background) {
    const code = crypto.randomUUID();
    set(state => ({
      requests: { ...state.requests, [session]: code },
      ...(!background ? {
        activeSession: session,
        error: null,
        report: state.reportsBySession[session] ?? null,
        retryAttempt: 1,
        status: "loading" as const,
      } : {}),
    }));
    return code;
  },
  setRefreshing(session) {
    set((state) => ({
      activeSession: session,
      error: null,
      report: state.reportsBySession[session] ?? null,
      retryAttempt: 1,
      status: "refreshing",
    }));
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const auditStoreApi = useAuditStore;
