import { expect, it } from "vitest";
import { applyChange, readChanges } from "../../queue/data/queueData";
import type { IndexChange } from "../../queue/type/queue.types";

it("ties a legal element update to its existing group for pending state and changes only the selected element", () => {
  const metadata = { legals: { groups: [{ code: "legal-1", page: "3", elements: [{ aspect: "subdivision", value: "Original" }, { aspect: "lot", value: "2" }] }] } };
  const change: IndexChange = { action: "update", explanation: "User change", old_index_label: "legal", old_index_aspect: "subdivision", old_index_value: "Original",
    new_index_label: "legal", new_index_aspect: "subdivision", new_index_value: "Updated", new_index_ambiguous: null };
  const changes = readChanges({ batch: null, session: "session", segment: "legal", data: JSON.stringify([change]) }, metadata, "task");
  expect(changes[0].code).toBe("legal-1");
  expect(changes[0].index).toMatchObject({ value: "Original", aspect: "subdivision" });
  expect(applyChange(metadata, changes[0]).legals?.groups?.[0].elements).toEqual([
    { aspect: "subdivision", value: "Updated", explanation: "User change" }, { aspect: "lot", value: "2" },
  ]);
});
