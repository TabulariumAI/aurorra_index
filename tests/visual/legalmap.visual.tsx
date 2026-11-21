import { createRoot } from "react-dom/client";
import { LegalMapContent } from "../../src/features/legalmap/component/LegalMapContent";
import { buildAddressMapEmbedUrl, DEFAULT_ADDRESS_MAP_ZOOM } from "../../src/features/addressmap/data/addressMap";
import { AddressMapContent } from "../../src/features/addressmap/component/AddressMapContent";
import { invalidFixture } from "../../src/features/legalmap/test/surveyFixture";
import { lotFixture } from "../../src/features/legalmap/test/aspectFixture";
import { hierarchyFixture } from "../../src/features/legalmap/test/hierarchyFixture";

import { metesFixture } from "../../src/features/legalmap/test/metesFixture";
import { streetFixture } from "../../src/features/legalmap/test/streetFixture";
import { matrixAmbiguous, matrixFixture, matrixGap, matrixOffset, matrixRetry } from "../../src/features/legalmap/test/matrixFixture";
import { curveFixture } from "../../src/features/legalmap/test/caseFixture";
import { reconstructionFixtures } from "../../src/features/legalmap/test/reconstructionFixture";

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

stage.innerHTML = "";

const main = document.createElement("main");
main.id = "main-container";
main.style.minHeight = "100vh";
main.style.height = "100vh";
stage.appendChild(main);

const params = new URLSearchParams(window.location.search);
const rows = params.get("rows") === "true";
const parcels = params.has("parcels");
const scope = params.get("scope");
const rowLabels = ["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"];

createRoot(main).render(
  <LegalMapContent
    onReadyChange={() => undefined}
    addressMaps={params.has("address") ? [{
      address: "123 Main St, Austin, TX 78701",
      content: <AddressMapContent
        source={buildAddressMapEmbedUrl("123 Main St, Austin, TX 78701")}
        zoom={DEFAULT_ADDRESS_MAP_ZOOM}
        onLoaderChange={() => undefined}
        onReadyChange={() => undefined}
      />,
    }] : undefined}
    legal={params.has("hierarchy") ? hierarchyFixture : params.has("property") ? { parcels_num: 1, groups: [{ type: "plss", elements: params.get("property") === "unresolved" ? [
      { aspect: "survey", value: "WILLIAM LUMPKIN SURVEY" }, { aspect: "aliquots", value: "PART OF THE 60.95 ACRES" },
      { aspect: "county", value: "DENTON COUNTY" }, { aspect: "state", value: "TX" },
    ] : [
      { aspect: "state", value: "MI" }, { aspect: "county", value: "WAYNE" }, { aspect: "section", value: "4" },
      { aspect: "township", value: "3 SOUTH" }, { aspect: "range", value: "9 EAST" },
      { aspect: "aliquots", value: "PART OF THE SOUTHWEST 1/4" }, { aspect: "survey", value: "ROMULUS TOWNSHIP" },
    ] }] } : params.has("message") ? { parcels_num: 1, groups: params.get("message")!.startsWith("partial-")
      ? params.get("message") === "partial-metes_bounds" ? [matrixGap]
        : params.get("message") === "partial-lot_block" ? [{ type: "lot_block", elements: [{ aspect: "lot", value: "7" }, { value: "Unlabeled source" }] }]
          : [{ type: "plss", elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] }, { type: "plss", elements: [{ aspect: "description", value: "Unresolved description" }] }]
      : [{ type: params.get("message")!, elements: [
        { aspect: "county", value: "DENTON COUNTY" }, { aspect: "state", value: "TX" },
        { aspect: params.get("message") === "metes_bounds" ? "bearings" : "description", value: "Unresolved description" },
      ] }] } : params.has("reconstruction") ? { parcels_num: 1, groups: [reconstructionFixtures[params.get("reconstruction")!]] }
      : params.has("curves") ? { parcels_num: 1, groups: curveFixture.groups.filter(group => group.type === "metes_bounds") }
      : params.has("condominium") ? { parcels_num: 1, groups: [{ type: "lot_block", elements: [
      { aspect: "unit", value: "2" },
      { aspect: "condominium", value: "SO FLO OFFICE CONDOMINIUMS" },
      { aspect: "block", value: "2569" },
      { aspect: "city", value: "SAN ANTONIO" },
      { aspect: "county", value: "BEXAR" },
      { aspect: "state", value: "TX" },
      { aspect: "parcel", value: "UNIT 2" },
    ] }] } : params.has("matrix") ? { parcels_num: 1, groups: [params.get("matrix") === "offset" ? matrixOffset : params.get("matrix") === "gap" ? matrixGap : params.get("matrix") === "ambiguous" ? matrixAmbiguous : params.get("matrix") === "retry" ? matrixRetry : matrixFixture] } : params.has("street") ? { ...streetFixture, groups: streetFixture.groups.map(group => params.get("street") === "unsupported" ? {
      ...group, elements: [group.elements[0], { ...group.elements[1], value: "16 ft FRONTAGE" }],
    } : group) } : params.has("metes") ? { ...metesFixture, parcels_num: Number(params.get("metes")) } : scope ? { ...lotFixture, groups: lotFixture.groups!.map(group => ({ ...group, elements: [
      ...group.elements!, { aspect: scope, value: "EASTERLY 40 FEET OF THE WESTERLY 80 FEET" },
    ] })) } : params.has("invalid") ? invalidFixture : {
      ...(parcels ? { parcels_num: Number(params.get("parcels")), } : {}),
      groups: rows ? rowLabels.slice(0, params.get("count") === "1" ? 1 : 2).map(value => ({
        type: "lot_block", elements: [
          { aspect: "right_of_way", value },
          { aspect: "subdivision", value: "INWOOD PLACE SUBDIVISION" },
          { aspect: "unit", value: "1" },
          { aspect: "city", value: "SAN ANTONIO" },
          { aspect: "state", value: "TEXAS" },
          { aspect: "county", value: "BEXAR COUNTY" },
        ],
      })) : parcels ? (params.get("ties") === "true" ? ["1", "2", "4482C"] : ["1", "4482C"]).map((block, index) => ({
        type: "lot_block", elements: [
          { aspect: "subdivision", value: "THE RANCH AT IRON HORSE" },
          { aspect: "phase", value: "II" }, { aspect: "block", value: block }, { aspect: "lot", value: "32" },
          ...(params.get("merged-rows") === "true" ? [{ aspect: "right_of_way", value: rowLabels[index] }] : []),
        ],
      })) : [
        {
          elements: [
            { aspect: "subdivision", value: "MISSION DEL LAGO UNIT 16A" },
            { aspect: "block", value: "49" },
            { aspect: "lot", value: "8" },
          ],
          type: "lot_block",
        },
        {
          elements: [
            { aspect: "subdivision", value: "BRIDGEWOOD SUBDIVISION" },
            { aspect: "block", value: "26" },
            { aspect: "lot", value: "8" },
          ],
          type: "lot_block",
        },
      ],
      plat: { county: "Bexar" },
    }}
  />,
);
