export const presentationFixture = {
  parcels_num: 1,
  summary: "One parcel described by a metes-and-bounds boundary with a commencement tie.",
  groups: [{
    type: "metes_bounds",
    source: "COMMENCING AT A PIN; NORTH 1 DEG. 08' 52\" EAST 519.87 FEET TO THE TRUE POINT OF BEGINNING; THENCE NORTH 58 DEG. 58' 10\" WEST 133.06 FEET; NORTH 44 DEG. 39' 50\" WEST 255.95 FEET; NORTH 48 DEG. 20' 35\" EAST 101.97 FEET; SOUTH 88 DEG. 51' 45\" EAST 224.08 FEET; SOUTH 1 DEG. 08' 52\" WEST 314.02 FEET; SAID LINE BEING NORTH 1 DEG. 08' 52\" EAST FROM THE POINT OF BEGINNING.",
    elements: [
      { aspect: "bearings", value: "N 1°08'52\" E; N 58°58'10\" W; N 44°39'50\" W; N 48°20'35\" E; S 88°51'45\" E; S 1°08'52\" W" },
      { aspect: "distances", value: "519.87 FT; 133.06 FT; 255.95 FT; 101.97 FT; 224.08 FT; 314.02 FT" },
      { aspect: "acreage", value: "1.352 ACRES" },
    ],
  }],
};

export const interruptedFixture = {
  parcels_num: 1,
  summary: "A boundary with one unreadable bearing; the remaining measurements are retained for review.",
  groups: [{
    type: "metes_bounds",
    source: "BEGINNING AT A PIN; EAST 788 FEET; EAST 420 FEET; NORTH 89 DEGREES 67 MINUTES EAST 239.4 FEET; EAST 96 FEET; WEST 239.4 FEET; NORTH 0 DEGREES 14 MINUTES WEST 96 FEET.",
    elements: [{ aspect: "acreage", value: "Boundary bearing requires review." }],
  }],
};

export const zeroFixture = {
  parcels_num: 1,
  summary: "Boundary measurements with three zero distances requiring review.",
  groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "North 07°55'52\" West; South 00°08'19\" East; South 89°45'41\" West; South 00°01'32\" East; North 00°01'32\" West; North 89°46'56\" West; North 00°00'11\" East; North 88°01'25\" West" },
    { aspect: "distances", value: "2.54 feet; 00'; 923.41 feet; 0.94 feet; 00'; 43.88 feet; 31.61 feet; 00'" },
  ] }],
};

export const closureFixture = {
  parcels_num: 1,
  summary: "One parcel with 30.210 acres, a commencement tie, and an additional course requiring review.",
  groups: [{
    type: "metes_bounds",
    source: "South 79°46'35\" West 375.07 feet; South 61°48'34\" West 53.61 feet; North 56°33'30\" West 512.68 feet; North 44°17'45\" West 758.82 feet; North 1°42'48\" East 534.01 feet; North 83°12'15\" East 791.49 feet; South 31°12'27\" East 1405.55 feet; South 66°45'12\" West 571.58 feet; North 3°09'25\" East 4726 in",
    elements: [
      { aspect: "bearings", value: "South 79°46'35\" West; South 61°48'34\" West; North 56°33'30\" West; North 44°17'45\" West; North 1°42'48\" East; North 83°12'15\" East; South 31°12'27\" East; South 66°45'12\" West; North 3°09'25\" East" },
      { aspect: "distances", value: "375.07 feet; 53.61 feet; 512.68 feet; 758.82 feet; 534.01 feet; 791.49 feet; 1405.55 feet; 571.58 feet; 4726 in" },
      { aspect: "acreage", value: "30.210 ACRES" },
    ],
  }],
};

export const frontageFixture = {
  parcels_num: 1,
  summary: "One parcel with frontage and side measurements requiring review.",
  groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "EASTERLY SIDE OF EAST 150TH STREET" },
    { aspect: "distances", value: "40 FEET FRONT; 140.44 FEET NORTHERLY; 140.50 FEET SOUTHERLY; 40 FEET REAR" },
  ] }],
};
