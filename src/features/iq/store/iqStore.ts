import { create } from "zustand";
import type { IqStoreState } from "../type/iq.types";

const initialState = {
  metadataEtag: null,
  activeSession: null,
  ackingCodes: new Set<string>(),
  error: null,
  report: null,
  retryAttempt: 0,
  status: "idle",
} satisfies Pick<IqStoreState, "metadataEtag" | "activeSession" | "ackingCodes" | "error" | "report" | "retryAttempt" | "status">;

export const useIqStore = create<IqStoreState>()((set) => ({
  ...initialState,
  generation: 0,
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
    set(state => ({
      ...initialState,
      ackingCodes: new Set<string>(),
      generation: state.generation + 1,
    }));
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setLoaded(session, report, metadataEtag) {
    set({ activeSession: session, error: null, report, metadataEtag, retryAttempt: 0, status: "success" });
  },
  setLoading(session, refresh) {
    set(state => ({ activeSession: session, error: null, retryAttempt: 1,
      metadataEtag: state.activeSession === session ? state.metadataEtag : null,
      status: refresh ? "refreshing" : "loading" }));
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const iqStoreApi = useIqStore;
