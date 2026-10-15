import { describe, expect, it } from "vitest";
import { matchSelection } from "../data/matchSelection";

const selection = {
  groups: [{ value: { token: ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO"], context: ["THE ALPHA BRAVO CHARLIE DELTA ECHO PARAGRAPH"], kind: ["BODY"] } }],
  pageName: "Exhibit-A",
};

describe("matchSelection", () => {
  it("matches an index value at 80 percent and rejects a lower match", () => {
    const metadata = { indexes: [
      { code: "low", segment: "party", page: "Exhibit-A", value: "alpha bravo changed changed echo", source: "unrelated text" },
      { code: "winner", segment: "party", page: "Exhibit-A", value: "alpha bravo charlie delta changed", source: "unrelated text" },
    ] };
    expect(matchSelection(selection, metadata)).toEqual({ code: "winner", segment: "party" });
  });

  it("matches the selected source when the value differs", () => {
    const metadata = { parties: [
      { code: "source", segment: "party", page: "Exhibit-A", value: "unrelated", source: "The alpha bravo charlie delta echo paragraph" },
    ] };
    expect(matchSelection(selection, metadata)).toEqual({ code: "source", segment: "party" });
  });

  it("uses the page name after text confidence and selects the first remaining tie", () => {
    const metadata = { indexes: [
      { code: "other-page", segment: "party", page: "9", value: "alpha bravo charlie delta echo" },
      { code: "first", segment: "party", page: "Exhibit-A", value: "alpha bravo charlie delta echo" },
      { code: "second", segment: "party", page: "Exhibit-A", value: "alpha bravo charlie delta echo" },
    ] };
    expect(matchSelection(selection, metadata)).toEqual({ code: "first", segment: "party" });
  });

  it("uses source confidence when candidate values tie", () => {
    const metadata = { indexes: [
      { code: "value", page_number: "Exhibit-A", value: "alpha bravo charlie delta echo", source: "unrelated" },
      { code: "source", page_number: "Exhibit-A", value: "alpha bravo charlie delta echo", source: "the alpha bravo charlie delta echo paragraph" },
    ] };
    expect(matchSelection(selection, metadata)).toBeNull();
  });

  it.each([
    ["alpha bravo charlie delta changed", true],
    ["alpha bravo charlie changed changed", false],
    ["echo delta charlie bravo alpha", false],
  ])("applies ordered token confidence to %s", (value, accepted) => {
    const metadata = { indexes: [{ code: "index", segment: "party", value }] };
    expect(matchSelection(selection, metadata)).toEqual(accepted ? { code: "index", segment: "party" } : null);
  });

  it("keeps higher text confidence ahead of the page criterion", () => {
    const metadata = { secrets: [
      { code: "higher", segment: "secrets", page: "9", value: "alpha bravo charlie delta echo" },
      { code: "page", segment: "secrets", page: "Exhibit-A", value: "alpha bravo charlie delta changed" },
    ] };
    expect(matchSelection(selection, metadata)).toEqual({ code: "higher", segment: "secrets" });
  });

  it("returns no index without an 80 percent match", () => {
    expect(matchSelection(selection, { indexes: [{ code: "different", value: "unrelated words" }] })).toBeNull();
  });

  it("returns the rendered segment for party, confidential, and loan rows", () => {
    expect(matchSelection(selection, { parties: [{ code: "party", value: "alpha bravo charlie delta echo" }] })).toEqual({ code: "party", segment: "party" });
    expect(matchSelection(selection, { secrets: [{ code: "secret", value: "alpha bravo charlie delta echo" }] })).toEqual({ code: "secret", segment: "secrets" });
    expect(matchSelection(selection, { indexes: [{ code: "loan", segment: "loan", value: "alpha bravo charlie delta echo" }] })).toEqual({ code: "loan", segment: "monetary" });
  });

  it("does not focus a party index hidden by the separate parties collection", () => {
    const metadata = {
      indexes: [{ code: "hidden", segment: "party", value: "alpha bravo charlie delta echo" }],
      parties: [{ code: "visible", segment: "party", value: "alpha bravo charlie delta echo" }],
    };
    expect(matchSelection(selection, metadata)).toEqual({ code: "visible", segment: "party" });
  });
});
