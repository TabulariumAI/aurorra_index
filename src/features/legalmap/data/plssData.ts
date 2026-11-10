import type { LegalGroup } from "aurora-core";
import { getElements, getNotes } from "./legalData";
import type { PlssItem, PlssScene } from "../type/plss.types";

function aliquotText(source: string): string {
  return source.toUpperCase().replace(/NORTHEAST/g, "NE").replace(/NORTHWEST/g, "NW").replace(/SOUTHEAST/g, "SE").replace(/SOUTHWEST/g, "SW")
    .replace(/NORTH/g, "N").replace(/SOUTH/g, "S").replace(/EAST/g, "E").replace(/WEST/g, "W").replace(/QUARTER/g, "1/4").replace(/HALF/g, "1/2");
}

function divideSection(parent: PlssItem, description: string, symbolic: boolean, source: string): PlssItem[] {
  const normalized = aliquotText(description);
  const divisions = normalized.trim() ? normalized.split(/\s*(?:,|\bAND\b|&)\s*/).filter(part => part.trim()) : [""];
  const items: PlssItem[] = [];
  for (const division of divisions) {
    const aliquots = [...division.matchAll(/\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/\s*([24])|([¼½]))/g)];
    if (!aliquots.length && !/\b(NE|NW|SE|SW|N|S|E|W)\s*\d+\s*\//.test(division) && divisions.some(part => /\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/|[¼½])/.test(part))) continue;
    const unresolved = /\b(EXCEPT|LESS|EXCLUDING|OR)\b/.test(division) || aliquots.some(aliquot => (aliquot[1].length === 2) !== ((aliquot[2] ?? (aliquot[3] === "¼" ? "4" : "2")) === "4"))
      || (!aliquots.length && /[NSWE]\s*\d+\s*\//.test(division));
    const partial = symbolic || unresolved || /\b(PARTS?|PORTIONS?|EXCEPT|LESS|EXCLUDING|OR)\b/.test(normalized);
    let area = { x: parent.x, y: parent.y, width: parent.width, height: parent.height };
    for (const aliquot of unresolved ? [] : [...aliquots].reverse()) {
      const direction = aliquot[1];
      const width = /[EW]/.test(direction) ? area.width / 2 : area.width;
      const height = /[NS]/.test(direction) ? area.height / 2 : area.height;
      area = { x: area.x + (direction.includes("E") ? area.width - width : 0), y: area.y + (direction.includes("S") ? area.height - height : 0), width, height };
      items.push({ ...area, kind: "rect", role: "division", label: "Aliquot", detail: `${aliquot[0]} of ${parent.detail}`, highlighted: false, partial: false });
    }
    items.push({ ...area, kind: "rect", role: "area", label: parent.detail, detail: source, highlighted: true, partial, caption: unresolved ? undefined : aliquots.map(aliquot => aliquot[0]).join(" of ") });
  }
  return items;
}

export function buildPlss(group: LegalGroup, title: string, summary?: string): PlssScene {
  const elements = getElements(group).filter(element => element.value?.trim());
  const notes = getNotes(elements);
  const items: PlssItem[] = Array.from({ length: 36 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    const section = row * 6 + (row % 2 === 0 ? 6 - column : column + 1);
    return { kind: "rect", role: "section", label: String(section), detail: `Section ${section}`, x: column * 100, y: row * 100, width: 100, height: 100, highlighted: false, partial: false };
  });
  const sourceSections = elements.some(element => /\b(?:sections?|secs?\.?)\s+\d+/i.test(element.value!));
  const explicitSection = elements.find(element => element.aspect?.toLowerCase() === "section" && /^\d+$/.test(element.value!.trim()) && Number(element.value) >= 1 && Number(element.value) <= 36)?.value?.trim();
  const summarySections = [...(summary ?? "").matchAll(/\b(?:sections?|secs?\.?)\s+(\d+(?:\s*(?:,|and|&|[-–])\s*\d+)*)/gi)];
  const section = explicitSection ?? (!sourceSections && summarySections.length === 1 && /^\d+$/.test(summarySections[0][1]) && Number(summarySections[0][1]) >= 1 && Number(summarySections[0][1]) <= 36 ? summarySections[0][1] : undefined);
  if (section && !explicitSection) notes.push({ label: "Section", value: section });
  const descriptions = section ? [...elements, { aspect: "description", value: `${elements.filter(element => element.aspect === "aliquots").map(element => element.value).join("; ")} of Section ${section}` }] : elements;
  const symbolic = group.type?.trim() === "government_lot" || group.type?.trim() === "fractional_section";
  for (const element of descriptions) {
    for (const clause of element.value!.split(/[;\n]/)) {
      const sections = [...clause.matchAll(/\b(?:sections?|secs?\.?)\s+(\d+(?:\s*(?:,|and|&|[-–])\s*\d+)*)/gi)];
      for (let index = 0; index < sections.length; index += 1) {
        const match = sections[index];
        const numbers: number[] = [];
        for (const part of match[1].split(/\s*(?:,|and|&)\s*/i)) {
          const range = part.split(/\s*[-–]\s*/).map(Number);
          if (range.some(number => number < 1 || number > 36) || (range.length === 2 && range[1] < range[0])) continue;
          for (let number = range[0]; number <= (range[1] ?? range[0]); number += 1) numbers.push(number);
        }
        const prefix = clause.slice(index === 0 ? 0 : sections[index - 1].index! + sections[index - 1][0].length, match.index);
        const description = prefix.trim() || (sections.length === 1 ? clause.slice(match.index! + match[0].length) : "");
        for (const section of numbers) {
          const parent = items.find(item => item.role === "section" && item.label === String(section));
          if (parent !== undefined) items.push(...divideSection(parent, description, symbolic, clause.trim()));
        }
      }
    }
  }
  let areas = items.filter(item => item.role === "area");
  if (!areas.length) {
    const aliquots = elements.filter(element => element.aspect === "aliquots").map(element => element.value).join("; ");
    if (/\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/\s*[24]|[¼½])/.test(aliquotText(aliquots)) && !sourceSections) {
      const parent: PlssItem = { kind: "rect", role: "section", label: "Section", detail: "Section", x: 0, y: 0, width: 100, height: 100, highlighted: false, partial: false };
      items.splice(0, items.length, parent, ...divideSection(parent, aliquots, symbolic, aliquots));
      areas = items.filter(item => item.role === "area");
    } else {
      return { title, notes, items: [], issue: "Cannot map: no section or aliquot could be resolved." };
    }
  }
  const sections = items.filter(item => item.role === "section" && areas.some(area => area.label === item.detail));
  const top = Math.min(...sections.map(section => section.y - section.height));
  const bottom = Math.max(...sections.map(section => section.y + section.height * 2));
  return {
    title, notes,
    items: items.filter(item => item.role !== "section" || (item.y >= top && item.y + item.height <= bottom))
      .map(item => item.role === "section" ? { ...item, highlighted: sections.includes(item) } : item),
  };
}
