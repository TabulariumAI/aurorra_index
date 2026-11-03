import type { LegalGroup } from "aurora-core";

export const matrixFixture: LegalGroup = {
  type: "metes_bounds",
  source: "North 72\" 45' West, a distance of 225 feet; South 17º 15' West, a distance of _54 feet; in a southeasterly direction, a distance of approximately 400 feet; substantially due north a distance of 350 feet to the place of beginning.",
  elements: [
    { aspect: "bearings", value: "NORTH 72° 45' WEST; SOUTH 17° 15' WEST; SUBSTANTIALLY DUE NORTH" },
    { aspect: "distances", value: "225 FEET; 54 FEET; APPROXIMATELY 400 FEET; 350 FEET" },
  ],
};

export const matrixOffset: LegalGroup = {
  type: "metes_bounds",
  source: "BEGINNING at a point 10 feet easterly from a monument; NORTH 100 FEET; SOUTH 100 FEET; EAST 50 FEET; WEST 50 FEET.",
};

export const matrixGap: LegalGroup = {
  type: "metes_bounds",
  elements: [
    { aspect: "bearings", value: '["NORTH", "", "SOUTH", "WEST"]' },
    { aspect: "distances", value: "100 FEET; 50 FEET; 100 FEET; 50 FEET" },
  ],
};

export const matrixAmbiguous: LegalGroup = {
  type: "metes_bounds",
  source: "NORTH 100 FEET; SOUTH 50 FEET; EAST 100 FEET; WEST 50 FEET; SOUTH 50 FEET; WEST 50 FEET; THENCE ALONG A CURVE TO THE RIGHT 25 FEET.",
};

export const matrixRetry: LegalGroup = {
  type: "metes_bounds",
  elements: [
    { aspect: "bearings", value: "NORTH 40 FEET; EAST 30 FEET" },
    { aspect: "distances", value: "SOUTH 53.13010235415598 DEGREES WEST 50 FEET" },
  ],
};
