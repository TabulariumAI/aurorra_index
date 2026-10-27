import type { MetadataJSONParts } from "aurora-core";

export type StoreValues = {
  session: string | null;
  json: MetadataJSONParts | null;
};

export type StateKey = keyof StoreValues;

export type StoreActions = {
  getJSON(session: string): MetadataJSONParts | null;
  removeJSON(session: string): void;
  resetJSON(): void;
  setJSON(session: string, json: MetadataJSONParts): void;
};

export type StoreState = StoreValues & StoreActions;
