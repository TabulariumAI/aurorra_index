import { beforeEach, expect, it } from "vitest";
import { useMapStore } from "../store/mapStore";

beforeEach(() => {
  localStorage.clear();
  useMapStore.setState({ detailsRatio: null });
});

it("persists only the chosen details percentage and restores it from storage", async () => {
  useMapStore.getState().setDetailsRatio(0.4);
  const saved = localStorage.getItem("aurorra-index:map")!;
  expect(JSON.parse(saved).state).toEqual({ detailsRatio: 0.4 });
  useMapStore.setState({ detailsRatio: null });
  localStorage.setItem("aurorra-index:map", saved);
  await useMapStore.persist.rehydrate();
  expect(useMapStore.getState().detailsRatio).toBe(0.4);
});
