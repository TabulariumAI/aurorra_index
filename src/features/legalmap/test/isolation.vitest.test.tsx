import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../component/PlssMap", async original => ({
  ...await original<typeof import("../component/PlssMap")>(),
  PlssMap: () => { throw new Error("Parcel drawing failed"); },
}));
vi.mock("../component/MetesMap", () => ({
  MetesMap: () => { throw new Error("Parcel drawing failed"); },
}));
vi.mock("../component/PlatMap", () => ({
  PlatMap: () => { throw new Error("Parcel drawing failed"); },
}));
import { LegalMapContent } from "../component/LegalMapContent";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it.each(["plss", "metes_bounds", "lot_block"])("keeps map controls when a %s drawing fails", type => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<LegalMapContent legal={{  groups: [{ type, source: "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET.", elements: [{ aspect: "section", value: "4" }, { aspect: "lot", value: "7" }] }] }} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Parcel drawing failed");
  expect(screen.getByRole("alert").querySelector("details")).not.toHaveAttribute("open");
  expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  expect(screen.queryByText("Healthy summary")).not.toBeInTheDocument();
  expect(document.querySelector(".legal-map-toolbar")).not.toBeNull();
});
