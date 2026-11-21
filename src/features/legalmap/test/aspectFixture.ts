import type { LegalPayload } from "aurora-core";

export const lotFixture: LegalPayload = {

  groups: [{ type: "lot_block", elements: [
    { aspect: "city", value: "CLEVELAND" },
    { aspect: "county", value: "CUYAHOGA" },
    { aspect: "state", value: "OHIO" },
    { aspect: "lot", value: "SUB NO. 37" },
    { aspect: "subdivision", value: "LOWRIE COMPANY'S FORESTDALE ALLOTMENT" },
  ] }],
};

export const aspectFixture: LegalPayload = {

  groups: [{ type: "lot_block", elements: [
    { aspect: "city", value: "CLEVELAND HEIGHTS" },
    { aspect: "county", value: "CUYAHOGA" },
    { aspect: "state", value: "OHIO" },
    { aspect: "part", value: "SUBLOTS NOS. 513 AND 514" },
  ] }],
};

export const aspectFields = [
  "subdivision_procedural", "lot_scope", "block_scope", "plat", "phase_scope",
  "unit_scope", "parcel_scope", "fraction", "fraction_scope", "part",
  "part_scope",
];
