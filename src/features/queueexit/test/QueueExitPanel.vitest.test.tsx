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

it("lists a segment reprocess without an invented index", () => {
  queueStoreApi.setState({ tasks: [{ id: "task", session: "session", segment: "party", batch: null,
    cursor: 0, status: "failed", result: null, error: "Failed",
    changes: [{ action: "reprocess", segment: "party" }],
    runtime: { onChange: vi.fn(), authToken: "token", intervalMs: 0, client: {
      patchIndex: vi.fn(), patchStatus: vi.fn(), indexData: vi.fn(), confirmIndex: vi.fn(),
      dropIndex: vi.fn(), updatePageSegments: vi.fn(), reprocessSegment: vi.fn(),
    } },
  }] });
  render(<QueueExitPanel />);
  expect(screen.getByText("Reprocess")).toBeVisible();
  expect(screen.getByText(/session · Party/)).toBeVisible();
});

it.each([false, true])("lists unfinished tasks and resolves approval=%s before logout", async (accept) => {
  queueStoreApi.setState({ tasks: [{
    id: "task", session: "document-one", segment: "property", batch: null, cursor: 0, status: "failed", result: null, error: "Error",
    changes: [{ action: "confirm", code: "index", index: { aspect: "parcel_id", value: "Parcel value" }, patch: null }],
    runtime: { onChange: vi.fn(), authToken: "token", intervalMs: 0, client: {
      patchIndex: vi.fn(), patchStatus: vi.fn(), indexData: vi.fn(), confirmIndex: vi.fn(),
      dropIndex: vi.fn(), updatePageSegments: vi.fn(), reprocessSegment: vi.fn(),
    } },
  }] });
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
