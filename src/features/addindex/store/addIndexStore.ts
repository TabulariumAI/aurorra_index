import { create } from "zustand";
import type { AddIndexStoreState } from "../type/addIndex.types";

export const useAddIndexStore = create<AddIndexStoreState>()((set) => ({
  request: null,
  close() {
    set({ request: null });
  },
  open(request) {
    set({ request });
  },
}));

export const addIndexStoreApi = useAddIndexStore;
