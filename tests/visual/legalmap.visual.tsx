import { createRoot } from "react-dom/client";
import { LegalMapContent } from "../../src/features/legalmap/component/LegalMapContent";

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

stage.innerHTML = "";

const main = document.createElement("main");
main.id = "main-container";
main.style.minHeight = "100vh";
stage.appendChild(main);

createRoot(main).render(
  <LegalMapContent
    onReadyChange={() => undefined}
    legal={{
      groups: [
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
