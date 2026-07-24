import { create } from "zustand";
import type { AddIndexStoreState } from "../type/addIndex.types";

export const useAddIndexStore = create<AddIndexStoreState>()((set) => ({
  selection: null,
  close() {
    set({ selection: null });
  },
  open(selection) {
    set({ selection });
  },
}));

export const addIndexStoreApi = useAddIndexStore;
