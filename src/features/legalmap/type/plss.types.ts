import type { MapNote } from "../data/legalData";

export type PlssItem = {
  kind: "rect";
  role: "section" | "division" | "area";
  label: string;
  detail: string;
  x: number;
  y: number;
  width: number;
  height: number;
  highlighted: boolean;
  partial: boolean;
  caption?: string;
};

export type PlssScene = {
  title: string;
  items: PlssItem[];
  notes: MapNote[];
  issue?: string;
};
