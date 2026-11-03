import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ fail: true }));
vi.mock("../data/surveyData", async original => {
  const data = await original<typeof import("../data/surveyData")>();
  return { ...data, getMapGroups: (...args: Parameters<typeof data.getMapGroups>) => {
    if (state.fail) throw new Error("Parcel preparation failed");
    return data.getMapGroups(...args);
  } };
});
import { LegalMapContent } from "../component/LegalMapContent";

afterEach(() => { cleanup(); vi.restoreAllMocks(); state.fail = true; });
it("retains the summary during parcel preparation failure and recovers on new legal data", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const legal = { summary: "Healthy summary", groups: [{ type: "plss", elements: [{ aspect: "section", value: "4" }] }] };
  const view = render(<LegalMapContent legal={legal} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Parcel preparation failed");
  expect(screen.getByText("Healthy summary")).toBeVisible();
  state.fail = false;
  view.rerender(<LegalMapContent legal={{ ...legal }} />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(document.querySelector(".legal-map-toolbar")).not.toBeNull();
});
