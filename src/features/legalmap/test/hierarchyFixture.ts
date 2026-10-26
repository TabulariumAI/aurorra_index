import type { LegalPayload } from "aurora-core";

export const hierarchyFields = {
  state: "ILLINOIS", county: "LAKE", jurisdiction: "LIBERTYVILLE TOWNSHIP", city: "GRAYSLAKE",
  subdivision: "WOODED GLEN GARDENS", condominium: "GLEN CONDOMINIUM",
  phase: "1", unit: "2", section: "A", block: "4", tract: "B", building: "C",
  lot: "24", condominium_unit: "2-3",
};

export const hierarchyFixture: LegalPayload = {
  parcels_num: 1,
  groups: [{ type: "lot_block", elements: Object.entries(hierarchyFields).map(([aspect, value]) => ({ aspect, value })) }],
};
