import type { MetadataJSONParts } from "../../features/metdata/type/metadata.types";

export type StoreValues = {
  jsonBySession: Record<string, MetadataJSONParts>;
};

export type StateKey = keyof StoreValues;

export type StoreActions = {
  getJSON(session: string): MetadataJSONParts | null;
  removeJSON(session: string): void;
  resetAllState(): void;
  resetJSON(): void;
  setJSON(session: string, json: MetadataJSONParts): void;
};

export type StoreState = StoreValues & StoreActions;
