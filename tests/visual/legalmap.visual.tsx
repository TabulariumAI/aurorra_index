import { createRoot } from "react-dom/client";
import { LegalMapContent } from "../../src/features/legalmap/component/LegalMapContent";
import { buildAddressMapEmbedUrl, DEFAULT_ADDRESS_MAP_ZOOM } from "../../src/features/addressmap/data/addressMap";
import { AddressMapContent } from "../../src/features/addressmap/component/AddressMapContent";

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
const rowLabels = ["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"];

createRoot(main).render(
  <LegalMapContent
    onReadyChange={() => undefined}
    addressMap={params.has("address") ? {
      address: "123 Main St, Austin, TX 78701",
      content: <AddressMapContent
        source={buildAddressMapEmbedUrl("123 Main St, Austin, TX 78701")}
        zoom={DEFAULT_ADDRESS_MAP_ZOOM}
        onLoaderChange={() => undefined}
        onReadyChange={() => undefined}
      />,
    } : undefined}
    legal={{
      ...(parcels ? { parcels_num: Number(params.get("parcels")), summary: "One parcel: Lot 32, Block 1, County Block 4482C, The Ranch at Iron Horse, Phase II, in Bexar County, Texas. PLATTED." } : {}),
      ...(rows ? { summary: "Two drainage rights of way, 2.669 and 5.455 acres, in Inwood Place Subdivision Unit 1, an addition to San Antonio, Bexar County, Texas. Plat Book 9563, pages 56–59. PLATTED." } : {}),
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
