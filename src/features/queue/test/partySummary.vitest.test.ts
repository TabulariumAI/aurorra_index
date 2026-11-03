import { expect, it } from "vitest";
import { getPanelData, type MetadataPayload } from "aurora-core";
import { applyChange, readChanges } from "../data/queueData";
import type { IndexChange } from "../type/queue.types";

it("preserves the party summary through additions, edits, confirmations and removals", () => {
  const index = { code: "p1", segment: "party", aspect: "person, Direct", label: "grantor", value: "John Smith", ambiguous: "YES" };
  const metadata: MetadataPayload = { indexes: [], parties: { summary: "John Smith conveys.", indexes: [index] } };
  const patch: IndexChange = { action: "update", allow_enrichment: false, explanation: "Correct name",
    old_index_label: "grantor", old_index_aspect: "person, Direct", old_index_value: "John Smith",
    new_index_label: null, new_index_aspect: null, new_index_value: "John A Smith", new_index_ambiguous: null };
  const changes = readChanges({ session: "session", batch: null, segment: "party", data: JSON.stringify([patch]) }, metadata, "edit");
  const updated = applyChange(metadata, changes[0]);
  expect(updated.parties?.summary).toBe(metadata.parties?.summary);
  expect(updated.parties?.indexes[0].value).toBe("John A Smith");
  expect(updated.indexes).toEqual([]);
  const confirmed = applyChange(updated, { action: "confirm", code: "p1", index, patch: null });
  expect(confirmed.parties?.indexes[0].ambiguous).toBe("NO");
  expect(confirmed.parties?.summary).toBe(metadata.parties?.summary);
  const add: IndexChange = { ...patch, action: "add", old_index_label: null, old_index_aspect: null, old_index_value: null,
    new_index_label: "grantee", new_index_aspect: "organization, Indirect", new_index_value: "ACME LLC", new_index_page: "1" };
  const additions = readChanges({ session: "session", batch: null, segment: "party", data: JSON.stringify([add]) }, confirmed, "add");
  const added = applyChange(confirmed, additions[0]);
  expect(getPanelData(added).parties).toHaveLength(2);
  expect(added.parties?.summary).toBe(metadata.parties?.summary);
  const removed = applyChange(added, { action: "drop", code: "p1", index, patch: null });
  expect(removed.parties?.indexes).toHaveLength(1);
  expect(removed.parties?.summary).toBe(metadata.parties?.summary);
  expect(metadata.parties?.indexes[0]).toEqual(index);
});
