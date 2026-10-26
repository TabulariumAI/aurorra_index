const source = "EXHIBIT A LAND SITUATED IN THE TOWNSHIP OF MONROE IN THE COUNTY OF CARROLL IN THE STATE OF OH PARCEL ONE: BEING LOCATED IN THE NORTHWEST QUARTER OF SECTION 10, TOWNSHIP 15, RANGE 7, AND BEING A PART OF A 7 ACRE TRACT HERETOFORE CONVEYED TO FINAS SWINEY BY DEED RECORDED IN VOLUME 126, PAGE 119 OF CARROLL COUNTY DEED RECORDS, THE PART HEREBY CONVEYED BEING MORE FULLY DESCRIBED AS FOLLOWS: BEGINNING AT AN IRON PIN ON THE SOUTH LINE OF THE ABOVE MENTIONED 7 ACRE TRACT AND THE SOUTH LINE OF THE NORTHWEST QUARTER OF SECTION 10, SAID IRON PIN BEING LOCATED SOUTH 85 DEGREES 30 MINUTES EAST ALONG SAID LINE 320.07 FEET FROM THE SOUTHWEST CORNER OF THE EAST HALF OF THE NORTHWEST QUARTER OF SECTION 10; THENCE FROM SAID BEGINNING AND WITH THE SOUTH LINE OF SAID QUARTER SECTION AND TRACT SOUTH 85 DEGREES 30 MINUTES EAST 276.00 FEET TO AN IRON PIN AT THE SOUTHEAST CORNER OF SAID 7 ACRE TRACT AND A CORNER OF A 44.61 ACRE TRACT (VOL. 181, PAGE 85); THENCE LEAVING SAID SOUTH LINE AND WITH THE BOUNDS OF SAID 7 ACRE TRACT THE FOLLOWING FOUR (4) COURSES; NORTH 11 DEGREES 21 MINUTES EAST WITH A WESTERLY BOUND OF THE AFOREMENTIONED 44.61 ACRE TRACT 249.89 FEET TO AN IRON PIN; THENCE CONTINUING WITH SAID WESTERLY BOUND NORTH 11 DEGREES 21 MINUTES EAST 37.41 FEET TO A POINT IN THE CENTER OF COUNTY ROAD #53 (CAMILLE ROAD); THENCE LEAVING SAID BOUND AND WITH THE CENTER OF SAID ROAD NORTH 82 DEGREES 06 MINUTES WEST 108.75 FEET AND NORTH 70 DEGREES 06 MINUTES WEST 79.75 FEET; THENCE LEAVING THE BOUNDS OF SAID 7 ACRE TRACT AND SAID ROAD SOUTH 26 DEGREES 15 MINUTES WEST 23.13 FEET TO AN IRON PIN; THENCE CONTINUING SOUTH 26 DEGREES 15 MINUTES WEST 313.73 FEET TO THE PLACE OF BEGINNING CONTAINING 1.589 ACRES, MORE OR LESS.";

export const metesFixture = {
  "summary": "Two parcels are described: Parcel One by PLSS location and metes-and-bounds calls, and Parcel Two by PLSS location and acreage. The attached Exhibit A description is excluded under the attachment rule.",
  "parcels_num": 2,
  "groups": [
    {
      "type": "plss",
      "elements": [
        {
          "aspect": "aliquots",
          "value": "NORTHWEST QUARTER OF SECTION 10",
          "ambiguous": "NO",
          "explanation": "GROUP_BASIS:PLSS Parcel One locator: Northwest Quarter of Section 10; basis is the stated aliquot and section."
        },
        {
          "aspect": "township",
          "value": "15",
          "ambiguous": "NO",
          "explanation": "Parcel One locator: Township 15; basis is the township designation in the legal description."
        },
        {
          "aspect": "range",
          "value": "7",
          "ambiguous": "NO",
          "explanation": "Parcel One locator: Range 7; basis is the range designation in the legal description."
        },
        {
          "aspect": "county",
          "value": "CARROLL",
          "ambiguous": "NO",
          "explanation": "Parcel locator: Carroll County, Ohio; jurisdiction is stated in the source description."
        },
        {
          "aspect": "state",
          "value": "OHIO",
          "ambiguous": "NO",
          "explanation": "Parcel locator: Ohio; jurisdiction is stated in the source description."
        }
      ],
      "code": "78754b59-57d0-4464-8829-f386189be26d",
      "source": source,
      "page": "2"
    },
    {
      "type": "plss",
      "elements": [
        {
          "aspect": "aliquots",
          "value": "EAST HALF OF THE NORTHWEST QUARTER OF SECTION 10",
          "ambiguous": "NO",
          "explanation": "Parcel Two locator: East Half of the Northwest Quarter of Section 10; basis is the stated aliquot and section."
        },
        {
          "aspect": "township",
          "value": "35",
          "ambiguous": "YES",
          "explanation": "Parcel Two locator: Township 35; source states this designation, differing from Parcel One's Township 15."
        },
        {
          "aspect": "range",
          "value": "7",
          "ambiguous": "NO",
          "explanation": "Parcel Two locator: Range 7; basis is the range designation in the legal description."
        },
        {
          "aspect": "county",
          "value": "CARROLL",
          "ambiguous": "NO",
          "explanation": "Parcel locator: Carroll County, Ohio; jurisdiction is stated in the source description."
        },
        {
          "aspect": "state",
          "value": "OHIO",
          "ambiguous": "NO",
          "explanation": "Parcel locator: Ohio; jurisdiction is stated in the source description."
        }
      ],
      "code": "4f5662c3-ba81-4b18-ab9f-a74c921d7ea8",
      "source": source,
      "page": "2"
    },
    {
      "type": "metes_bounds",
      "elements": [
        {
          "aspect": "bearings",
          "value": "SOUTH 85 DEGREES 30 MINUTES EAST; NORTH 11 DEGREES 21 MINUTES EAST; NORTH 82 DEGREES 06 MINUTES WEST; NORTH 70 DEGREES 06 MINUTES WEST; SOUTH 26 DEGREES 15 MINUTES WEST",
          "ambiguous": "NO",
          "explanation": "GROUP_BASIS:METES Parcel One locator: successive boundary courses; basis is the stated bearings defining the parcel perimeter."
        },
        {
          "aspect": "distances",
          "value": "320.07 FEET; 276.00 FEET; 249.89 FEET; 37.41 FEET; 108.75 FEET; 79.75 FEET; 23.13 FEET; 313.73 FEET",
          "ambiguous": "NO",
          "explanation": "Parcel One locator: beginning offset and successive courses; basis is the stated distances defining boundary lengths."
        },
        {
          "aspect": "acreage",
          "value": "1.589 ACRES, MORE OR LESS",
          "ambiguous": "NO",
          "explanation": "Parcel One locator: concluding area statement; basis is the stated acreage within the boundary description."
        }
      ],
      "code": "364bdc75-f24b-448a-98b1-a0efa12d479f",
      "source": source,
      "page": "2"
    },
    {
      "type": "metes_bounds",
      "elements": [
        {
          "aspect": "bearings",
          "value": "SOUTH 85 DEGREES 30 MINUTES EAST; NORTH 11 DEGREES 21 MINUTES EAST; NORTH 82 DEGREES 06 MINUTES WEST; NORTH 70 DEGREES 06 MINUTES WEST; SOUTH 26 DEGREES 15 MINUTES WEST",
          "ambiguous": "NO",
          "explanation": "GROUP_BASIS:METES Parcel One locator: successive boundary courses; basis is the stated bearings defining the parcel perimeter."
        },
        {
          "aspect": "distances",
          "value": "320.07 FEET; 276.00 FEET; 249.89 FEET; 37.41 FEET; 108.75 FEET; 79.75 FEET; 23.13 FEET; 313.73 FEET",
          "ambiguous": "NO",
          "explanation": "Parcel One locator: beginning offset and successive courses; basis is the stated distances defining boundary lengths."
        },
        {
          "aspect": "acreage",
          "value": "2.005 ACRES, MORE OR LESS",
          "ambiguous": "NO",
          "explanation": "Parcel Two locator: concluding area statement; basis is the stated acreage within the legal description."
        }
      ],
      "code": "0cb8c2b8-eddb-43b3-8d4d-16afd44ba397",
      "source": source,
      "page": "2"
    }
  ]
};
