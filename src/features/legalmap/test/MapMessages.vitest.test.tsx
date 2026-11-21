import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { MapIssue } from "../component/MapSurface";

describe("map messages", () => {
  it("places the compact disclosure beside its message and preserves its reason", () => {
    const reason = "The boundary contains a synthetic closing border.";
    const { container, rerender } = render(<MapIssue title="Parcel 1" issue={reason} compact />);
    const summary = container.querySelector("summary")!;
    expect(summary).toHaveTextContent("Map preview is incomplete.");
    expect(summary).not.toHaveTextContent("Details");
    expect(summary.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    fireEvent.click(summary);
    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(screen.getByText(reason)).toBeVisible();
    fireEvent.click(summary);
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    rerender(<MapIssue title="Parcel 1" issue={reason} />);
    expect(container.querySelector("summary")).toHaveTextContent("Details");
    expect(screen.getByRole("heading", { name: "Map preview unavailable" })).toBeVisible();
  });

  it.each(["plss", "lot_block", "metes_bounds"])("keeps the existing map surface, details and splitter for unresolved %s data", type => {
    render(<LegalMapContent legal={{ groups: [{ type, elements: [
      { aspect: "county", value: "DENTON COUNTY" },
      { aspect: "state", value: "TX" },
      { aspect: type === "metes_bounds" ? "bearings" : "description", value: "Unresolved description" },
    ] }] }} />);
    const note = screen.getByRole("note", { name: "Parcel 1" });
    expect(note).toHaveTextContent("Map preview unavailable");
    expect(note.closest("[data-legal-map-surface]")).not.toBeNull();
    expect(note.querySelector("img")).toBeNull();
    expect(screen.getByRole("separator", { name: "Resize map and details" })).toBeVisible();
    expect(note.querySelector("details")).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText("Details"));
    expect(note.querySelector("details")).toHaveAttribute("open");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("Unresolved description", { exact: true })).toBeVisible();
  });

  it("keeps a healthy parcel drawing alongside a separate unavailable parcel", () => {
    render(<LegalMapContent legal={{ parcels_num: 2, groups: [
      { type: "plss", elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] },
      { type: "plss", elements: [{ aspect: "description", value: "Unresolved description" }] },
    ] }} />);
    expect(screen.getByRole("img", { name: "Parcel 1 schematic" })).toBeVisible();
    expect(screen.getByRole("note", { name: "Parcel 2" })).toHaveTextContent("Map preview unavailable");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
