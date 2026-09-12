import { describe, expect, it } from "vitest";
import { aspectGroups, formatSelection } from "../data/addIndexData";
import type { AddIndexSelection } from "../type/addIndex.types";

describe("formatSelection", () => {
  it("merges tokens, removes duplicate values, and keeps only complete contexts", () => {
    const firstContext = "JOHN SMITH, RESIDING AT 69-55 62ND STREET";
    const secondContext = "JOHN M. SMITH, AS TRUSTEE OF THE JOHN M. SMITH LIVING TRUST";
    const selection: AddIndexSelection = {
      groups: [
        { value: { context: [firstContext], kind: ["BODY"], token: ["JOHN", "SMITH,"] } },
        { value: { context: [firstContext], kind: ["BODY"], token: ["JOHN SMITH"] } },
        { value: { context: ["JOHN SMITH"], kind: ["BODY"], token: ["JOHN SMITH"] } },
        { value: { context: [secondContext], kind: ["BODY"], token: ["JOHN M. SMITH"] } },
      ],
      pageNumber: 3,
    };

    expect(formatSelection(selection)).toEqual({
      context: `${firstContext}\n\n${secondContext}`,
      values: "JOHN SMITH JOHN M. SMITH",
    });
  });

  it("ignores null, blank, and punctuation-only selection values", () => {
    const selection: AddIndexSelection = {
      groups: [
        { value: { context: [null, "  Paragraph   context  "], kind: ["BODY"], token: [null, " ", "..."] } },
      ],
      pageNumber: 1,
    };

    expect(formatSelection(selection)).toEqual({
      context: "Paragraph context",
      values: "",
    });
  });

  it("returns all segment aspect groups", () => {
    expect(aspectGroups({
      aspects: {
        party: ["grantor", "grantee"],
        property: ["parcel_id"],
      },
    })).toEqual({
      party: ["grantor", "grantee"],
      property: ["parcel_id"],
    });
  });

  it("rejects an invalid aspects resource", () => {
    expect(() => aspectGroups({ aspects: { party: ["grantor", 1] } })).toThrow("Aspects resource is invalid.");
  });
});
