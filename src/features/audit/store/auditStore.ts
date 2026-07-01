import { create } from "zustand";
import type { AuditStoreState } from "../type/audit.types";

const initialState = {
  activeSession: null,
  error: null,
  report: null,
  status: "idle",
} satisfies Pick<AuditStoreState, "activeSession" | "error" | "report" | "status">;

export const useAuditStore = create<AuditStoreState>()((set) => ({
  ...initialState,
  resetAudit() {
    set({
      activeSession: null,
      error: null,
      report: null,
      status: "idle",
    });
  },
  setError(error) {
    set({ error, status: "error" });
  },
  setLoaded(session, report) {
    set({ activeSession: session, error: null, report, status: "success" });
  },
  setLoading(session) {
    set((state) => ({
      activeSession: session,
      error: null,
      report: state.report,
      status: "loading",
    }));
  },
  setRefreshing(session) {
    set((state) => ({
      activeSession: session,
      error: null,
      report: state.report,
      status: "refreshing",
    }));
  },
}));

export const auditStoreApi = useAuditStore;
