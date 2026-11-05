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

export const useIqStore = create<IqStoreState>()((set, get) => ({
  ...initialState,
  generation: 0,
  ackGeneration: 0,
  ackStart(session, code) {
    const state = get();
    if (state.activeSession !== session || state.ackingCodes.has(code)) return null;
    set({ ackingCodes: new Set([...state.ackingCodes, code]) });
    return state.ackGeneration;
  },
  ackFinish(session, generation, code, error) {
    const current = get();
    if (current.activeSession !== session || current.ackGeneration !== generation || !current.ackingCodes.has(code)) return false;
    set((state) => {
      const ackingCodes = new Set(state.ackingCodes);
      ackingCodes.delete(code);
      return {
        ackingCodes,
        error,
        status: error ? "error" : "success",
        report: !error && state.report
          ? {
            ...state.report,
            gates: state.report.gates.filter((gate) => gate.code !== code),
          }
          : state.report,
      };
    });
    return true;
  },
  resetIq() {
    set(state => ({
      ...initialState,
      ackingCodes: new Set<string>(),
      generation: state.generation + 1,
      ackGeneration: state.ackGeneration + 1,
    }));
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setLoaded(session, report, metadataEtag) {
    set(state => ({ activeSession: session, error: null, report, metadataEtag, retryAttempt: 0, status: "success",
      ackGeneration: state.ackGeneration + 1, ackingCodes: new Set<string>() }));
  },
  setLoading(session, refresh) {
    set(state => ({ activeSession: session, error: null, retryAttempt: 1,
      report: state.activeSession === session ? state.report : null,
      ackGeneration: state.ackGeneration + 1, ackingCodes: new Set<string>(),
      metadataEtag: state.activeSession === session ? state.metadataEtag : null,
      status: refresh ? "refreshing" : "loading" }));
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const iqStoreApi = useIqStore;
