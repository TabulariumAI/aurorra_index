import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { surveyFixture } from "./surveyFixture";

const boundary = surveyFixture.groups!.find(group => group.type === "metes_bounds")!;
const easement = boundary.elements!.find(element => element.aspect === "easement")!;
const explanation = "Locator: concluding clause; basis: expressly subjects the land to highways and recorded easements.";

describe("metes and bounds easement notes", () => {

  it("shows an easement without requiring acreage or a summary", () => {
    render(<LegalMapContent legal={{ groups: [{ ...boundary, elements: boundary.elements!.filter(element => element.aspect !== "acreage") }] }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Easement" }));
    expect(screen.getByLabelText("Easement details")).toHaveTextContent(easement.value!);
    expect(screen.queryByRole("tab", { name: "Acreage" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Summary" })).toBeNull();
  });

  it("preserves every easement entry and its boundary group without combining or reordering", () => {
    render(<LegalMapContent legal={{ groups: [
      { ...boundary, elements: [...boundary.elements!, { ...easement, explanation }] },
      { ...boundary, elements: boundary.elements!.map(element => element === easement ? { ...element, explanation: "Second tract concluding clause." } : element) },
    ] }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Easement" }));
    const first = screen.getByLabelText("Parcel 1 easement details");
    const second = screen.getByLabelText("Parcel 2 easement details");
    expect(within(first).getByRole("heading", { name: "Parcel 1" })).toBeVisible();
    expect(within(first).getAllByText(easement.value!, { exact: true })).toHaveLength(2);
    expect(within(first).getByText(explanation)).toBeVisible();
    expect(within(second).getByRole("heading", { name: "Parcel 2" })).toBeVisible();
    expect(second).toHaveTextContent("Second tract concluding clause.");
    expect(second).not.toHaveTextContent(explanation);
  });
});
