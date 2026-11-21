import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ fail: true }));
vi.mock("../data/mapGroups", async original => {
  const data = await original<typeof import("../data/mapGroups")>();
  return { ...data, getMapGroups: (...args: Parameters<typeof data.getMapGroups>) => {
    if (state.fail) throw new Error("Parcel preparation failed");
    return data.getMapGroups(...args);
  } };
});
import { LegalMapContent } from "../component/LegalMapContent";

afterEach(() => { cleanup(); vi.restoreAllMocks(); state.fail = true; });
it("retries preparation through the shared error boundary without replacing the payload", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<LegalMapContent legal={{ groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] }] }} />);
  expect(screen.getByRole("alert").querySelector("details")).not.toHaveAttribute("open");
  state.fail = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("img", { name: "Parcel 1 schematic" })).toBeVisible();
});
it("contains parcel preparation failure and recovers on new legal data", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const legal = {  groups: [{ type: "plss", elements: [{ aspect: "section", value: "4" }] }] };
  const view = render(<LegalMapContent legal={legal} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Parcel preparation failed");
  expect(screen.queryByText("Healthy summary")).not.toBeInTheDocument();
  state.fail = false;
  view.rerender(<LegalMapContent legal={{ ...legal }} />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(document.querySelector(".legal-map-toolbar")).not.toBeNull();
});
