import { expect, it } from "vitest";
import type { MetadataPayload } from "aurora-core";
import { applyChange, readChanges } from "../data/queueData";
import type { IndexChange } from "../type/queue.types";

it("routes execution edits and additions to their own node without merging people", () => {
  const execution = { summary: "John and Mary have visible signatures.", indexes: ["John", "Mary"].map(name => ({ code: name, aspect: "signatory_signature", label: `${name} Smith Signature`, value: "Yes", page: "1", segment: "execution" })) };
  const metadata: MetadataPayload = { indexes: [{ code: "ack", segment: "acknowledgment", value: "January 2, 2025" }], execution };
  const patch: IndexChange = {
    action: "update", allow_enrichment: false, explanation: "Mary's line is blank",
    old_index_label: "Mary Smith Signature", old_index_aspect: "signatory_signature", old_index_value: "Yes",
    new_index_label: null, new_index_aspect: null, new_index_value: "No", new_index_ambiguous: null,
  };
  const changes = readChanges({ session: "session", batch: null, segment: "execution", data: JSON.stringify([patch]) }, metadata, "change");
  expect(changes).toHaveLength(1);
  const updated = applyChange(metadata, changes[0]);
  expect(updated.indexes).toEqual(metadata.indexes);
  expect(updated.execution?.indexes.map(index => index.value)).toEqual(["Yes", "No"]);
  expect(updated.execution?.summary).toBe(execution.summary);
  const add: IndexChange = { ...patch, action: "add", old_index_label: null, old_index_aspect: null, old_index_value: null,
    new_index_label: "Alice Brown Signature", new_index_aspect: "signatory_signature", new_index_value: "Yes", new_index_page: "1" };
  const addition = readChanges({ session: "session", batch: null, segment: "execution", data: JSON.stringify([add]) }, updated, "add");
  const result = applyChange(updated, addition[0]);
  expect(result.execution?.indexes).toHaveLength(3);
  expect(result.execution?.summary).toBe(execution.summary);
  expect(result.indexes).toEqual(metadata.indexes);
  const fresh = { indexes: metadata.indexes };
  const unverified = readChanges({ session: "session", batch: null, segment: "execution", data: JSON.stringify([add]) }, fresh, "unverified");
  const created = applyChange(fresh, unverified[0]);
  expect(created.execution?.summary).toBeNull();
  expect(created.execution?.indexes).toHaveLength(1);
});
