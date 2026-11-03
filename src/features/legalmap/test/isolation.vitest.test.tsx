import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../component/SurveyMap", async original => ({
  ...await original<typeof import("../component/SurveyMap")>(),
  SurveyMap: () => { throw new Error("Parcel drawing failed"); },
}));
import { LegalMapContent } from "../component/LegalMapContent";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("keeps map controls and the summary when a parcel drawing fails", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<LegalMapContent legal={{ summary: "Healthy summary", groups: [{ type: "plss", elements: [{ aspect: "section", value: "4" }] }] }} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Parcel drawing failed");
  expect(screen.getByText("Healthy summary")).toBeVisible();
  expect(document.querySelector(".legal-map-toolbar")).not.toBeNull();
});
