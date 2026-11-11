import type { LegalGroup } from "aurora-core";

import { closureFixture } from "./presentationFixture";

const source = "BEGINNING at a pin; THENCE NORTH 100 FEET; THENCE EAST 50 FEET; THENCE SOUTH 100 FEET; THENCE WEST 50 FEET to the point of beginning.";

export const reconstructionFixtures: Record<string, LegalGroup> = {
  property: closureFixture.groups[0],
  closing: { type: "metes_bounds", source: source.slice(0, source.indexOf("THENCE WEST")) },
  acreage: { type: "metes_bounds", elements: [{ aspect: "acreage", value: "2.5 ACRES" }] },
  partial: { type: "metes_bounds", source: "BEGINNING at a pin; THENCE NORTH 100 FEET.", elements: [{ aspect: "acreage", value: "1 ACRE" }] },
  source: { type: "metes_bounds", source, elements: [
    { aspect: "bearings", value: "NORTH 200 FEET; EAST 50 FEET; SOUTH 200 FEET; WEST 50 FEET" },
    { aspect: "acreage", value: "1 ACRE" },
  ] },
};
