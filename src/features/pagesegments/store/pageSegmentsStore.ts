import { create } from "zustand";
import type { PageSegmentsWorkerError } from "../type/pageSegments.types";

export type PageSegmentsStatus = "idle" | "saving" | "success" | "error";

export type PageSegmentsStore = {
  committed: string[];
  error: PageSegmentsWorkerError | null;
  selected: string[];
  status: PageSegmentsStatus;
  reset: (segments: string[]) => void;
  restore: () => void;
  setError: (error: PageSegmentsWorkerError) => void;
  setSaved: (segments: string[]) => void;
  setSelected: (segments: string[]) => void;
  setSaving: () => void;
};

export const usePageSegmentsStore = create<PageSegmentsStore>()((set) => ({
  committed: [],
  error: null,
  selected: [],
  status: "idle",
  reset(segments) {
    set({ committed: [...segments], error: null, selected: [...segments], status: "idle" });
  },
  restore() {
    set((state) => ({ error: null, selected: [...state.committed], status: "idle" }));
  },
  setError(error) {
    set({ error, status: "error" });
  },
  setSaved(segments) {
    set({ committed: [...segments], error: null, selected: [...segments], status: "success" });
  },
  setSelected(segments) {
    set({ selected: [...segments] });
  },
  setSaving() {
    set({ error: null, status: "saving" });
  },
}));

export const pageSegmentsStoreApi = usePageSegmentsStore;
