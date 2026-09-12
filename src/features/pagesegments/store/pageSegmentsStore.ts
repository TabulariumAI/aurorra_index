import { create } from "zustand";
import type { PageSegmentsRequest, PageSegmentsWorkerError } from "../type/pageSegments.types";

export type PageSegmentsStatus = "idle" | "saving" | "error";

export type PageSegmentsStore = {
  committed: string[];
  error: PageSegmentsWorkerError | null;
  request: PageSegmentsRequest | null;
  selected: string[];
  status: PageSegmentsStatus;
  close: () => void;
  open: (request: PageSegmentsRequest) => void;
  reset: (segments: string[]) => void;
  restore: () => void;
  setError: (error: PageSegmentsWorkerError) => void;
  setSelected: (segments: string[]) => void;
  setSaving: () => void;
};

export const usePageSegmentsStore = create<PageSegmentsStore>()((set) => ({
  committed: [],
  error: null,
  request: null,
  selected: [],
  status: "idle",
  close() {
    set({ request: null });
  },
  open(request) {
    set({ request });
  },
  reset(segments) {
    set({ committed: [...segments], error: null, selected: [...segments], status: "idle" });
  },
  restore() {
    set((state) => ({ error: null, selected: [...state.committed], status: "idle" }));
  },
  setError(error) {
    set({ error, status: "error" });
  },
  setSelected(segments) {
    set({ error: null, selected: [...segments], status: "idle" });
  },
  setSaving() {
    set({ error: null, status: "saving" });
  },
}));

export const pageSegmentsStoreApi = usePageSegmentsStore;
