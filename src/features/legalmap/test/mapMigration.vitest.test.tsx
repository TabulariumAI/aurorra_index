import type { LegalPayload } from "aurora-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getMapGroups } from "../data/mapGroups";
import { normalizeLegalData } from "../data/platData";
import { LegalMapContent } from "../component/LegalMapContent";
import { acreageFixture } from "./acreageFixture";
import { aspectFixture, lotFixture } from "./aspectFixture";
import { curveFixture, sectionFixture } from "./caseFixture";
import { hierarchyFixture } from "./hierarchyFixture";
import { metesFixture } from "./metesFixture";
import { matrixAmbiguous, matrixFixture, matrixGap, matrixOffset, matrixRetry } from "./matrixFixture";
import { parcelFixture } from "./parcelFixture";
import { closureFixture, frontageFixture, interruptedFixture, presentationFixture, zeroFixture } from "./presentationFixture";
import { streetFixture } from "./streetFixture";
import { boundaryFixture, clusterFixture, incompleteFixture, invalidFixture, quarterFixture, surveyFixture, tieFixture } from "./surveyFixture";

afterEach(cleanup);

const fixtures: Record<string, LegalPayload> = {
  acreageFixture, aspectFixture, lotFixture, curveFixture, sectionFixture, hierarchyFixture, metesFixture,
  parcelFixture, closureFixture, frontageFixture, interruptedFixture, presentationFixture, zeroFixture,
  streetFixture, boundaryFixture, clusterFixture, incompleteFixture, invalidFixture, quarterFixture,
  surveyFixture, tieFixture,
  ...Object.fromEntries(Object.entries({ matrixAmbiguous, matrixFixture, matrixGap, matrixOffset, matrixRetry })
    .map(([name, group]) => [name, { parcels_num: 1, groups: [group] }])),
};

describe("map migration parity", () => {
  it.each(["plss", "metes_bounds"])("retains unresolved %s warnings beside drawable groups in one parcel", type => {
    const valid = type === "plss"
      ? { type, elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] }
      : { type, source: "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET." };
    const unresolved = { type, elements: [{ aspect: "description", value: "Unresolved parcel description" }] };
    const legal = { parcels_num: 1, groups: [valid, unresolved] };
    const issue = getMapGroups(legal)[1].scene!.issue!;
    render(<LegalMapContent legal={legal} />);
    expect(screen.getByRole("img", { name: "Parcel 1 schematic" })).toBeVisible();
    expect(screen.getByRole("note")).toHaveTextContent(issue);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(1);
  });

  it.each(["plss", "metes_bounds"])("keeps unresolved %s parcels separate from healthy parcel drawings", type => {
    const valid = type === "plss"
      ? { type, elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] }
      : { type, source: "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET." };
    const unresolved = { type, elements: [{ aspect: "description", value: "Unresolved parcel description" }] };
    const legal = { parcels_num: 2, groups: [valid, unresolved] };
    render(<LegalMapContent legal={legal} />);
    expect(screen.getByRole("img", { name: "Parcel 1 schematic" })).toBeVisible();
    expect(screen.getByRole("alert", { name: "Parcel 2" })).toHaveTextContent(getMapGroups(legal)[1].scene!.issue!);
    expect(screen.queryByRole("note")).toBeNull();
  });

  it.each(["plss", "metes_bounds"])("retains data-only %s errors without a blank drawing or divider", type => {
    const legal = { parcels_num: 1, groups: [1, 2].map(index => ({ type, elements: [
      { aspect: type === "plss" ? "description" : "bearings", value: `Unresolved parcel ${index}` },
    ] })) };
    render(<LegalMapContent legal={legal} />);
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.getByText("Unresolved parcel 1")).toBeVisible();
    expect(screen.getByText("Unresolved parcel 2")).toBeVisible();
  });

  it.each(Object.entries(fixtures))("preserves all prepared geometry and source data for %s", (name, legal) => {
    const source = JSON.stringify(legal);
    const groups = getMapGroups(legal);
    expect(groups).toMatchSnapshot(name);
    expect(getMapGroups(legal)).toEqual(groups);
    expect(normalizeLegalData(legal)).toMatchSnapshot(`${name} plat`);
    expect(JSON.stringify(legal)).toBe(source);
  });

  it.each(["plss", "government_lot", "fractional_section"])("keeps %s isolated from boundary geometry through tab switches and refresh", type => {
    const legal = { parcels_num: 1, groups: [
      { type: "lot_block", elements: [{ aspect: "lot", value: "7" }] },
      matrixFixture,
      { type, elements: [{ aspect: "description", value: "NE1/4 of Section 12" }] },
    ] };
    const source = JSON.stringify(legal);
    const view = render(<LegalMapContent legal={legal} />);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(document.querySelector("[data-survey-line], [data-survey-section]")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(4);
    expect(document.querySelectorAll("[data-survey-line][data-unconfirmed]")).toHaveLength(4);
    expect(document.querySelector("[data-survey-section], [data-legal-map-lot]")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    expect(document.querySelectorAll("[data-survey-section]")).toHaveLength(18);
    expect(document.querySelectorAll("[data-survey-area]")).toHaveLength(1);
    expect(document.querySelector("[data-survey-line], [data-survey-point], [data-boundary-fill]")).toBeNull();
    expect(document.querySelector("[data-survey-partial]") !== null).toBe(type !== "plss");
    view.rerender(<LegalMapContent legal={{ ...legal, groups: [legal.groups[0], matrixRetry, legal.groups[2]] }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
    expect(screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr")).toHaveLength(3);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(3);
    expect(document.querySelector("[data-survey-section]")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Lot & block" }));
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(document.querySelector("[data-survey-line], [data-survey-section]")).toBeNull();
    expect(JSON.stringify(legal)).toBe(source);
  });
});
