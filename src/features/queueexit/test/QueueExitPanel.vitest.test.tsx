import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { queueStoreApi } from "../../queue/store/queueStore";
import { QueueExitPanel } from "../component/QueueExitPanel";
import { useQueueExitStore } from "../store/queueExitStore";

beforeEach(() => { useQueueExitStore.getState().decide(false); queueStoreApi.getState().reset(); });

it("approves immediately when no tasks remain", async () => {
  await expect(useQueueExitStore.getState().request()).resolves.toBe(true);
  expect(useQueueExitStore.getState().open).toBe(false);
});

it.each([false, true])("lists unfinished tasks and resolves approval=%s before logout", async (accept) => {
  queueStoreApi.setState({ tasks: [{ id: "task", session: "document-one", segment: "property", batch: null, cursor: 0, status: "failed", result: null, error: "Error", changes: [{ action: "patch", code: "index", index: { aspect: "parcel_id", value: "Parcel value" }, patch: { action: "add" } }], runtime: {} }] as never });
  const done = vi.fn();
  let approval!: Promise<boolean>;
  act(() => { approval = useQueueExitStore.getState().request(); });
  void approval.then(done);
  render(<QueueExitPanel />);
  expect(screen.getByText("Parcel value")).toBeVisible();
  expect(screen.getByText(/document-one/)).toBeVisible();
  expect(done).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: accept ? "Cancel changes and log out" : "Stay signed in" }));
  await expect(approval).resolves.toBe(accept);
  expect(queueStoreApi.getState().tasks).toHaveLength(accept ? 0 : 1);
});
