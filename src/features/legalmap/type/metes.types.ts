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

export type ReconstructedBoundary = {
  courses: MatrixCourse[];
  beginning?: number;
  ending?: number;
  closed: boolean;
  issue?: string;
  schematic?: boolean;
  method: "source" | "extracted" | "synthetic" | "none";
  completion: "measured" | "partial" | "synthetic" | "open";
  closureMetres?: number;
  calculatedAcres?: number;
};

export type MetesScene = Omit<ReconstructedBoundary, "courses"> & {
  title: string;
  items: MetesLine[];
  notes: MapNote[];
  courses: { bearing: string; distance?: string; confirmed: boolean; issue?: string; target?: number; unassigned?: boolean }[];
};

export type BoundaryCourse = {
  kind: "bearing" | "curve";
  bearing: string;
  distance?: string;
  clause: string;
  detail: string;
  issue?: string;
  synthetic?: true;
  unassigned?: true;
};

export type MatrixCourse = BoundaryCourse & {
  angle: number | null;
  metres: number | null;
  paired: boolean;
  missingBearing: boolean;
  missingDistance: boolean;
};

export type SurveyCourse = MatrixCourse & {
  kind: "bearing";
  distance: string;
  angle: number;
  metres: number;
  missingBearing: false;
  missingDistance: false;
};

export type BoundaryInput = {
  source?: string;
  bearings: string[];
  distances: string[];
  acreage?: string;
  closureRatio?: number;
  allowSchematic?: boolean;
};
