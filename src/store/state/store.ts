import { create } from "zustand";
import type { StoreState } from "../type/store.types";

export const useStore = create<StoreState>()((set, get) => ({
  session: null,
  json: null,
  getJSON(session) {
    return get().session === session ? get().json : null;
  },
  removeJSON(session) {
    if (get().session === session) set({ json: null });
  },
  resetJSON() {
    set({ session: null, json: null });
  },
  setJSON(session, json) {
    set({ session, json });
  },
}));

export const storeApi = useStore;
