import type { MapNote } from "../data/legalData";

export type MetesPoint = { x: number; y: number };
export type MetesLine = {
  kind: "line";
  label: string;
  detail: string;
  sequence: number;
  from: MetesPoint;
  to: MetesPoint;
  bearing: string;
  distance: string;
  confirmed: boolean;
  arc?: { center: MetesPoint; radius: number; sweep: number; turn: number };
};

export type MetesScene = {
  title: string;
  items: MetesLine[];
  notes: MapNote[];
  courses: { bearing: string; distance?: string; confirmed: boolean; issue?: string; target?: number }[];
  beginning?: number;
  ending?: number;
  closed?: boolean;
  issue?: string;
  schematic?: boolean;
};

export type BoundaryCourse = {
  kind: "bearing" | "curve";
  bearing: string;
  distance?: string;
  clause: string;
  detail: string;
  angle?: number | null;
  metres?: number | null;
  issue?: string;
};

export type MatrixCourse = BoundaryCourse & {
  angle: number | null;
  metres: number | null;
  paired: boolean;
  missingBearing: boolean;
  missingDistance: boolean;
};
