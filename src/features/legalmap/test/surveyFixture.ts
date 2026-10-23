import type { LegalPayload } from "aurora-core";

export const surveyFixture: LegalPayload = {
  summary: "One parcel is described by part of the Northeast Quarter of Section 32, Township 14, Range 4, with metes-and-bounds boundaries and an area of 14.585 acres, more or less, in Carroll County, Ohio.",
  groups: [
    { type: "plss", elements: [
      { aspect: "aliquots", value: "PART OF THE NORTHEAST QUARTER" },
      { aspect: "township", value: "14" }, { aspect: "range", value: "4" },
      { aspect: "county", value: "CARROLL" }, { aspect: "state", value: "OHIO" },
    ] },
    { type: "metes_bounds", elements: [
      { aspect: "bearings", value: "S 0° 01' 30'' E; N 86° 00' 57'' E; S 15° 14' 51'' E; N 89° 13' 18'' W; S 44° 00' 00'' W; S 79° 00' 00'' W; N 0° 01' 30'' W" },
      { aspect: "distances", value: "323.26 FEET; 1646.83 FEET; 221.74 FEET; 568.00 FEET; 452.00 FEET; 834.31 FEET; 576.13 FEET" },
      { aspect: "acreage", value: "14.585 ACRES, MORE OR LESS" },
      { aspect: "easement", value: "SUBJECT TO ALL LEGAL HIGHWAYS AND ANY EASEMENTS, RESTRICTIONS, OR RESERVATIONS OF RECORD" },
    ] },
  ],
};

export const quarterFixture: LegalPayload = {
  summary: "One parcel is described by a PLSS aliquot and township/range, with metes-and-bounds boundaries in Romulus Township, Wayne County, Michigan.",
  groups: [{ type: "plss", elements: [
    { aspect: "aliquots", value: "SW1/4 of Section 4" },
    { aspect: "township", value: "TOWN 3 SOUTH" },
    { aspect: "range", value: "RANGE 9 EAST" },
  ] }],
};

export const acreageText = "30.210 ACRES, MORE OR LESS; 29.184 ACRES IN NORTHWEST QUARTER; 0.487 ACRES IN NORTHEAST QUARTER; 0.539 ACRES IN SOUTHWEST QUARTER";
export const boundaryFixture: LegalPayload = {
  summary: "One parcel is described by metes-and-bounds calls with stated acreage portions.",
  groups: surveyFixture.groups!.filter(group => group.type === "metes_bounds").map(group => ({
    ...group,
    elements: group.elements!.map(element => element.aspect === "acreage" ? { ...element, value: acreageText } : element),
  })),
};

export const tieFixture: LegalPayload = {
  summary: "Two parcels are described, with the second parcel incomplete in the extracted text.",
  groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "S85°30'00\"E; N50°45'14\"E; S82°55'32\"E; N32°31'24\"E; N13°56'44\"W; N10°04'59\"E; S39°52'03\"E; S26°15'42\"W; N85°30'00\"W" },
    { aspect: "distances", value: "71.16 ft; 70.79 ft; 81.62 ft; 71.16 ft; 143.82 ft; 298.87 ft; 320.51 ft; 336.86 ft; 248.91 ft" },
    { aspect: "acreage", value: "2.005 ACRES OF LAND, MORE OR LESS" },
  ] }],
};

export const incompleteFixture: LegalPayload = {
  summary: "Two parcels are described: a 1.589-acre tract and a 2.005-acre tract.",
  groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "SOUTH 85 DEGREES 30 MINUTES EAST; NORTH 11 DEGREES 21 MINUTES EAST; NORTH 82 DEGREES 06 MINUTES WEST; NORTH 70 DEGREES 06 MINUTES WEST; SOUTH 26 DEGREES 15 MINUTES WEST" },
    { aspect: "distances", value: "320.07 FEET; 276.00 FEET; 249.89 FEET; 37.41 FEET; 108.75 FEET; 79.75 FEET; 23.13 FEET; 313.73 FEET" },
    { aspect: "acreage", value: "1.589 ACRES, MORE OR LESS" },
    { aspect: "right_of_way", value: "LEGAL HIGHWAYS AND RIGHTS-OF-WAY" },
    { aspect: "easement", value: "EASEMENTS OF RECORD", explanation: "Subject to easements of record." },
  ] }, ...tieFixture.groups!],
};

export const invalidFixture: LegalPayload = {
  ...quarterFixture,
  groups: [...quarterFixture.groups!, { type: "metes_bounds", elements: [
    { aspect: "bearings", value: "SOUTH 0 DEGREES, 14 MINUTES EAST; NORTH 89 DEGREES, 57 MINUTES EAST; NORTH 89 DEGREES 67 MINUTES EAST; SOUTH 0 DEGREES, 14 MINUTES EAST; SOUTH 89 DEGREES, 57 MINUTES WEST; NORTH 0 DEGREES 14 MINUTES WEST" },
    { aspect: "distances", value: "788.0 FEET; 420.0 FEET; 239.4 FEET; 96.0 FEET" },
  ] }],
};

export const clusterFixture: LegalPayload = {
  summary: "A schematic parcel with closely spaced commencement and boundary points.",
  groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "SOUTH 79 DEGREES 46 MINUTES 35 SECONDS WEST; S61°48'34\"W; N56°33'30\"W; N44°17'45\"W; N1°42'48\"E; N83°12'15\"E; S31°12'27\"E; S66°45'13.32\"W" },
    { aspect: "distances", value: "375.07 ft; 53.61 ft; 512.68 ft; 758.82 ft; 534.01 ft; 791.49 ft; 1405.55 ft; 571.58115 ft" },
    { aspect: "acreage", value: acreageText },
  ] }],
};
