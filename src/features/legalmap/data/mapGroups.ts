import type { LegalElement, LegalGroup, LegalPayload } from "aurora-core";
import { getElements, getNotes, resolveGroups, type MapNote } from "./legalData";
import { getPlatDetails } from "./platData";
import { buildMatrix } from "./metesData";
import { buildPlss } from "./plssData";
import type { MetesScene } from "../type/metes.types";
import type { PlssScene } from "../type/plss.types";

type MapGroup = {
  group: LegalGroup;
  notes: MapNote[];
  aspects: LegalElement[];
  issue?: string;
} & (
  | { view: "Lot & block"; scene: undefined }
  | { view: "Metes & Bounds"; scene: MetesScene }
  | { view: "PLSS"; scene: PlssScene }
);

export function getMapGroups(legal: LegalPayload | null | undefined): MapGroup[] {
  const views: Record<string, MapGroup["view"]> = { lot_block: "Lot & block", plss: "PLSS", government_lot: "PLSS", fractional_section: "PLSS", metes_bounds: "Metes & Bounds" };
  const groups = resolveGroups(legal).filter((group): group is LegalGroup => typeof group === "object" && group !== null);
  const plssCount = groups.filter(group => views[group.type?.trim() ?? ""] === "PLSS").length;
  return groups.flatMap((group): MapGroup[] => {
    const type = group.type?.trim() ?? "";
    if (!Object.hasOwn(views, type)) return [];
    const elements = getElements(group).filter(element => element.value?.trim());
    if (elements.length === 0 && !group.source?.trim()) return [];
    const view = views[type];
    if (view === "PLSS") {
      const scene = buildPlss(group, view, plssCount === 1 ? legal?.summary : undefined);
      return [{ view, group, scene, notes: scene.notes, aspects: [], issue: undefined }];
    }
    if (view === "Metes & Bounds") {
      const scene = buildMatrix(group, view);
      return [{ view, group, scene, notes: scene.notes, aspects: [], issue: undefined }];
    }
    return [{ view, group, scene: undefined, ...getPlatDetails({ ...group, type }) }];
  });
}
