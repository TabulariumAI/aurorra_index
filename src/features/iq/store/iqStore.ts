import { create } from "zustand";
import type { IqStoreState } from "../type/iq.types";

const initialState = {
  activeSession: null,
  ackingCodes: new Set<string>(),
  error: null,
  report: null,
  retryAttempt: 0,
  status: "idle",
} satisfies Pick<IqStoreState, "activeSession" | "ackingCodes" | "error" | "report" | "retryAttempt" | "status">;

export const useIqStore = create<IqStoreState>()((set) => ({
  ...initialState,
  ackStart(code) {
    set((state) => ({
      ackingCodes: new Set([...state.ackingCodes, code]),
    }));
  },
  ackSuccess(code) {
    set((state) => {
      const ackingCodes = new Set(state.ackingCodes);
      ackingCodes.delete(code);
      return {
        ackingCodes,
        report: state.report
          ? {
            ...state.report,
            gates: state.report.gates.filter((gate) => gate.code !== code),
          }
          : state.report,
      };
    });
  },
  resetIq() {
    set({
      ...initialState,
      ackingCodes: new Set<string>(),
    });
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setLoaded(session, report) {
    set({ activeSession: session, error: null, report, retryAttempt: 0, status: "success" });
  },
  setLoading(session) {
    set({ activeSession: session, error: null, retryAttempt: 1, status: "loading" });
  },
  setRefreshing(session) {
    set({ activeSession: session, error: null, retryAttempt: 1, status: "refreshing" });
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const iqStoreApi = useIqStore;
