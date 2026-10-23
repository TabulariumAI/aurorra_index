import { create } from "zustand";
import { persist } from "zustand/middleware";

type MapState = {
  detailsRatio: number | null;
  setDetailsRatio(ratio: number): void;
};

export const useMapStore = create<MapState>()(persist((set) => ({
  detailsRatio: null,
  setDetailsRatio: (detailsRatio) => set({ detailsRatio }),
}), { name: "aurorra-index:map", partialize: (state) => ({ detailsRatio: state.detailsRatio }) }));
