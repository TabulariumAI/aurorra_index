import { create } from "zustand";
import type { StoreState } from "../type/store.types";

export const useStore = create<StoreState>()((set, get) => ({
  jsonBySession: {},
  getJSON(session) {
    return get().jsonBySession[session] ?? null;
  },
  removeJSON(session) {
    set((state) => {
      const next = { ...state.jsonBySession };
      delete next[session];
      return { jsonBySession: next };
    });
  },
  resetAllState() {
    set({ jsonBySession: {} });
  },
  resetJSON() {
    set({ jsonBySession: {} });
  },
  setJSON(session, json) {
    set((state) => ({
      jsonBySession: {
        ...state.jsonBySession,
        [session]: json,
      },
    }));
  },
}));

export const storeApi = useStore;
