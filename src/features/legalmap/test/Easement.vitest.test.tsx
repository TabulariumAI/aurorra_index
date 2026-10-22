import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { buildBoundary, getMapGroups } from "../data/surveyData";
import { legalMapStyles } from "../style/legalMapStyles";
import { surveyFixture } from "./surveyFixture";

const boundary = surveyFixture.groups!.find(group => group.type === "metes_bounds")!;
const easement = boundary.elements!.find(element => element.aspect === "easement")!;
const explanation = "Locator: concluding clause; basis: expressly subjects the land to highways and recorded easements.";

describe("metes and bounds easement notes", () => {
  it("preserves the extracted explanation without changing courses or reported acreage", () => {
    const group = { ...boundary, elements: boundary.elements!.map(element => element === easement ? { ...element, explanation } : element) };
    const original = JSON.stringify(group);
    const scene = buildBoundary(group, "Metes & Bounds");
    expect(scene.notes).toContainEqual({ label: "Easement", value: easement.value, explanation });
    expect(scene.items).toEqual(buildBoundary(boundary, "Metes & Bounds").items);
    expect(scene.notes.find(note => note.label === "Acreage")).toEqual(buildBoundary(boundary, "Metes & Bounds").notes.find(note => note.label === "Acreage"));
    expect(JSON.stringify(group)).toBe(original);
  });

  it("shows the exact clause and supporting explanation below acreage and above references", () => {
    const legal = { ...surveyFixture, groups: [
      { ...boundary, elements: boundary.elements!.map(element => element === easement ? { ...element, explanation } : element) },
      { type: "plat_reference", elements: [{ aspect: "plat_book", value: "42" }] },
    ] };
    render(<LegalMapContent legal={legal} />);
    const info = document.querySelector("[data-legal-map-info]") as HTMLElement;
    expect(within(info).getAllByRole("heading").map(node => node.textContent)).toEqual(["Summary", "Acreage", "Easement", "Reference"]);
    const card = screen.getByLabelText("Easement details");
    expect(card).toHaveStyle({ background: legalMapStyles.infoCard.background, overflowWrap: "anywhere" });
    expect(within(card).getByText(easement.value!, { exact: true })).toBeVisible();
    expect(within(card).getByText(explanation, { exact: true })).toBeVisible();
    expect(within(card).getByText("Location not specified in this clause — not plotted.")).toBeVisible();
    expect(card.querySelector("svg")).toBeNull();
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(7);
    expect(document.querySelectorAll("[data-boundary-fill]")).toHaveLength(1);
    expect(getMapGroups(legal)[0].scene!.items).toEqual(getMapGroups(surveyFixture).find(entry => entry.view === "Metes & Bounds")!.scene!.items);
  });

  it("shows the clause without inventing an explanation and hides it on other map views", () => {
    render(<LegalMapContent legal={surveyFixture} addressMap={{ address: "123 Main St", content: <div>Address map</div> }} />);
    const card = screen.getByLabelText("Easement details");
    expect(card).toHaveTextContent(easement.value!);
    expect(card).not.toHaveTextContent("Locator:");
    for (const tab of ["PLSS", "Address"]) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      expect(screen.queryByRole("heading", { name: "Easement" })).toBeNull();
    }
    fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
    expect(screen.getByLabelText("Easement details")).toHaveTextContent(easement.value!);
  });

  it.each([undefined, "", "   "])("omits an empty easement value %s", value => {
    render(<LegalMapContent legal={{ groups: [{ ...boundary, elements: boundary.elements!.map(element => element === easement ? { ...element, value, explanation } : element) }] }} />);
    expect(screen.queryByRole("heading", { name: "Easement" })).toBeNull();
    expect(screen.queryByText(explanation)).toBeNull();
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(7);
  });

  it("shows an easement without requiring acreage or a summary", () => {
    render(<LegalMapContent legal={{ groups: [{ ...boundary, elements: boundary.elements!.filter(element => element.aspect !== "acreage") }] }} />);
    expect(screen.getByLabelText("Easement details")).toHaveTextContent(easement.value!);
    expect(screen.queryByRole("heading", { name: "Acreage" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Summary" })).toBeNull();
  });

  it("preserves every easement entry and its boundary group without combining or reordering", () => {
    render(<LegalMapContent legal={{ groups: [
      { ...boundary, elements: [...boundary.elements!, { ...easement, explanation }] },
      { ...boundary, elements: boundary.elements!.map(element => element === easement ? { ...element, explanation: "Second tract concluding clause." } : element) },
    ] }} />);
    const first = screen.getByLabelText("Metes & Bounds 1 easement details");
    const second = screen.getByLabelText("Metes & Bounds 2 easement details");
    expect(within(first).getByRole("heading", { name: "Metes & Bounds 1" })).toBeVisible();
    expect(within(first).getAllByText(easement.value!, { exact: true })).toHaveLength(2);
    expect(within(first).getByText(explanation)).toBeVisible();
    expect(within(second).getByRole("heading", { name: "Metes & Bounds 2" })).toBeVisible();
    expect(second).toHaveTextContent("Second tract concluding clause.");
    expect(second).not.toHaveTextContent(explanation);
  });
});
