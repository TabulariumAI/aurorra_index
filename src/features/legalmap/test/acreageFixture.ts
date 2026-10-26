import type { LegalPayload } from "aurora-core";

export const acreageValues = ["10.69 ACRES GROSS, MORE OR LESS", "0.83 ACRE EASEMENT TRACT"];

export const acreageFixture: LegalPayload = {
  summary: "Two parcels in Lot 6, Block 12, Winnie Suburbs Subdivision.",
  groups: acreageValues.map(value => ({ type: "lot_block", elements: [
    { aspect: "lot", value: "6" }, { aspect: "block", value: "12" },
    { aspect: "subdivision", value: "WINNIE SUBURBS SUBDIVISION" },
    { aspect: "acreage", value }, { aspect: "county", value: "CHAMBERS COUNTY" },
    { aspect: "state", value: "TEXAS" },
  ] })),
};
