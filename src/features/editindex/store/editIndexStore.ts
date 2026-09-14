import { create } from "zustand";
import type { EditIndexStoreState } from "../type/editIndex.types";

export const useEditIndexStore = create<EditIndexStoreState>()((set) => ({
  request: null,
  open(request) { set({ request: { ...request, index: { ...request.index } } }); },
  close() { set({ request: null }); },
}));
export const editIndexStoreApi = useEditIndexStore;
