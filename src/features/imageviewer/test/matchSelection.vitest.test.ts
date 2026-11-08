import { describe, expect, it } from "vitest";
import { matchSelection } from "../data/matchSelection";

const selection = {
  groups: [{ value: { token: ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO"], context: ["THE ALPHA BRAVO CHARLIE DELTA ECHO PARAGRAPH"], kind: ["BODY"] } }],
  pageName: "Exhibit-A",
};

describe("matchSelection", () => {
  it("matches a legal group's donor original", () => {
    expect(matchSelection(selection, { legals: { groups: [{ code: "legal", page: "Exhibit-A", original: "alpha bravo charlie delta echo", elements: [{ aspect: "lot", value: "7" }] }] } })).toEqual({ code: "legal", segment: "legal" });
  });
  it.each(["index", "party"])("matches original instead of corrected %s values", kind => {
    const rows = [{ code: "raw", segment: "party", original: "alpha bravo charlie delta echo", value: "corrected name", source: null }];
    const metadata = kind === "party" ? { parties: { summary: null, indexes: rows } } : { indexes: rows };
    expect(matchSelection(selection, metadata)).toEqual({ code: "raw", segment: "party" });
    rows[0].original = "unrelated raw text";
    rows[0].value = "alpha bravo charlie delta echo";
    expect(matchSelection(selection, metadata)).toBeNull();
  });

  it.each([undefined, null, ""])("uses value only for missing or null original: %s", original => {
    const metadata = { indexes: [{ code: "raw", segment: "party", original, value: "alpha bravo charlie delta echo", source: null }] };
    expect(matchSelection(selection, metadata)).toEqual(original === "" ? null : { code: "raw", segment: "party" });
  });

  it("matches an index value at 80 percent and rejects a lower match", () => {
    const metadata = { indexes: [
      { code: "low", segment: "party", page: "Exhibit-A", value: "alpha bravo changed changed echo", source: "unrelated text" },
      { code: "winner", segment: "party", page: "Exhibit-A", value: "alpha bravo charlie delta changed", source: "unrelated text" },
    ] };
    expect(matchSelection(selection, metadata)).toEqual({ code: "winner", segment: "party" });
  });

  it("matches the selected source when the value differs", () => {
    const metadata = { parties: { summary: null, indexes: [
      { code: "source", segment: "party", page: "Exhibit-A", value: "unrelated", source: "The alpha bravo charlie delta echo paragraph" },
    ] } };
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
    expect(matchSelection(selection, { parties: { summary: null, indexes: [{ code: "party", value: "alpha bravo charlie delta echo" }] } })).toEqual({ code: "party", segment: "party" });
    expect(matchSelection(selection, { secrets: [{ code: "secret", value: "alpha bravo charlie delta echo" }] })).toEqual({ code: "secret", segment: "secrets" });
    expect(matchSelection(selection, { indexes: [{ code: "loan", segment: "loan", value: "alpha bravo charlie delta echo" }] })).toEqual({ code: "loan", segment: "monetary" });
  });

  it.each([{ indexes: [] }, { indexes: [{ code: "enriched", original: "unrelated name", value: "Corrected name" }] }])("matches a rendered raw party alongside enriched indexes %j", ({ indexes }) => {
    const metadata = {
      indexes: [{ code: "raw", segment: "party", original: "alpha bravo charlie delta echo", value: "Corrected raw name" }],
      parties: { summary: null, indexes },
    };
    expect(matchSelection(selection, metadata)).toEqual({ code: "raw", segment: "party" });
  });

  it("uses the rendered enriched party when donor codes are shared", () => {
    const metadata = {
      indexes: [{ code: "shared", segment: "party", original: "alpha bravo charlie delta echo", value: "Raw name" }],
      parties: { summary: null, indexes: [{ code: "shared", original: "unrelated name", value: "Corrected name" }] },
    };
    expect(matchSelection(selection, metadata)).toBeNull();
    metadata.parties.indexes[0].original = "alpha bravo charlie delta echo";
    expect(matchSelection(selection, metadata)).toEqual({ code: "shared", segment: "party" });
  });

  it("preserves nonparty precedence when party, secret, and legal matches tie", () => {
    const original = "alpha bravo charlie delta echo";
    expect(matchSelection(selection, {
      indexes: [{ code: "reference", segment: "reference", original }],
      parties: { summary: null, indexes: [{ code: "party", original }] },
      secrets: [{ code: "secret", value: original }],
      legals: { groups: [{ code: "legal", original, elements: [{ aspect: "lot", value: "7" }] }] },
    })).toEqual({ code: "reference", segment: "reference" });
  });
});
