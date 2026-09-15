import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../../queue/store/queueStore";
import { EditIndexPanel } from "../component/EditIndexPanel";
import type { EditIndexPanelProps } from "../type/editIndex.types";

const index = { code: "idx-1", segment: "party", label: "Raw Label", aspect: "grantor,grantee", value: " Original  Value ", source: "Original source", page: "3" };
function props(): EditIndexPanelProps {
  return {
    apiGatewayUrl: "https://gateway.test", authToken: "token", intervalMs: 0, batchCode: "batch",
    retryIntervalMs: 0, retryLimit: 0, request: { index, segment: "party", session: "session" },
    onQueueChange: vi.fn(), onClose: vi.fn(), onError: vi.fn(), onReadyChange: vi.fn(),
    onResource: vi.fn(async () => ({ aspects: { party: ["grantor", "grantee"], property: ["parcel_id"] } })),
    workerClient: { patchIndex: vi.fn(() => new Promise<never>(() => {})), patchStatus: vi.fn(),
      indexData: vi.fn(), confirmIndex: vi.fn(), dropIndex: vi.fn(), reprocessSegment: vi.fn(), updatePageSegments: vi.fn() },
  };
}
beforeEach(() => {
  queueStoreApi.getState().reset();
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [index] }));
});

describe("EditIndexPanel", () => {
  it("treats reordered aspects as unchanged but detects replacing an aspect with a duplicate", async () => {
    const config = props();
    config.onResource = vi.fn(async () => ({ aspects: { party: ["grantor", "grantee"], property: ["grantor"] } }));
    render(<EditIndexPanel {...config} />);
    await screen.findByRole("button", { name: "Remove Grantor (Party)" });
    fireEvent.click(screen.getByRole("button", { name: "Remove Grantor (Party)" }));
    fireEvent.click(screen.getAllByRole("option", { name: "Grantor" })[0]);
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Remove Grantee (Party)" }));
    fireEvent.click(screen.getByRole("option", { name: "Grantor" }));
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(config.workerClient!.patchIndex).not.toHaveBeenCalled();
  });
  it("disables unchanged actions and disables manually reverted values without closing", async () => {
    const config = props();
    const { container } = render(<EditIndexPanel {...config} />);
    await screen.findByRole("button", { name: "Remove Grantor (Party)" });
    const footer = container.querySelector('section[aria-label="Edit index form"]')!.lastElementChild;
    expect(footer).toContainElement(screen.getByRole("button", { name: "Update" }));
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    const input = screen.getByRole("textbox", { name: "Index" });
    fireEvent.change(input, { target: { value: "Changed" } });
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
    expect(footer).toContainElement(screen.getByRole("button", { name: "Update" }));
    fireEvent.change(input, { target: { value: index.value } });
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.change(input, { target: { value: index.value } });
    expect(input).toHaveValue(index.value);
    expect(footer).toBeInTheDocument();
    expect(footer).toContainElement(screen.getByRole("button", { name: "Update" }));
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
    expect(config.onClose).not.toHaveBeenCalled();
    expect(config.workerClient!.patchIndex).not.toHaveBeenCalled();
  });
  it("prefills raw values and comma-separated Types and sends one update with unchanged original selectors", async () => {
    const config = props();
    render(<EditIndexPanel {...config} />);
    expect(screen.getByRole("textbox", { name: "Index" })).toHaveValue(index.value);
    await screen.findByRole("button", { name: "Remove Grantor (Party)" });
    expect(screen.getByRole("button", { name: "Remove Grantee (Party)" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Additional details" }));
    expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(index.label);
    expect(screen.getByRole("textbox", { name: "Page Number" })).toHaveValue("3");
    expect(screen.getByRole("textbox", { name: "Source" })).toHaveValue(index.source);
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "New value" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: "New label" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove Grantee (Party)" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(screen.getByRole("option", { name: "Parcel Id" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "New value" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(config.onClose).toHaveBeenCalledOnce());
    expect(config.workerClient!.patchIndex).toHaveBeenCalledExactlyOnceWith("token", "session", "party", {
      action: "update", explanation: "P 3  Original source", new_index_label: "New label", new_index_aspect: "grantor,parcel_id",
      new_index_value: "New value", new_index_ambiguous: null,
      old_index_label: "Raw Label", old_index_aspect: "grantor,grantee", old_index_value: " Original  Value ",
    });
    expect(index.value).toBe(" Original  Value ");
  });

  it("preserves an existing Type missing from current resources and optional original fields", async () => {
    const config = props();
    config.request = { segment: "party", session: "session", index: { value: "Original", aspect: "custom_type" } };
    render(<EditIndexPanel {...config} />);
    await screen.findByRole("button", { name: "Remove Custom Type (Party)" });
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "Edited" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(config.workerClient!.patchIndex).toHaveBeenCalledOnce());
    expect(config.workerClient!.patchIndex).toHaveBeenCalledWith("token", "session", "party", expect.objectContaining({
      old_index_label: null, old_index_aspect: "custom_type", old_index_value: "Original", new_index_aspect: "custom_type",
    }));
  });

  it("resets the draft when another index opens and cancels without a request", async () => {
    const config = props();
    const { rerender } = render(<EditIndexPanel {...config} />);
    await screen.findByRole("button", { name: "Remove Grantor (Party)" });
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "Unsaved" } });
    rerender(<EditIndexPanel {...config} request={{ session: "session", segment: "property", index: { value: "Parcel", aspect: "parcel_id" } }} />);
    expect(screen.getByRole("textbox", { name: "Index" })).toHaveValue("Parcel");
    await screen.findByRole("button", { name: "Remove Parcel Id (Property)" });
    expect(screen.queryByRole("button", { name: "Remove Grantor (Party)" })).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "Draft" } });
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByRole("textbox", { name: "Index" })).toHaveValue("Draft");
    expect(config.onClose).not.toHaveBeenCalled();
    expect(config.workerClient!.patchIndex).not.toHaveBeenCalled();
    expect(queueStoreApi.getState().tasks).toEqual([]);
  });

  it("reports resource failure and disables confirmation", async () => {
    const config = props();
    vi.mocked(config.onResource).mockRejectedValueOnce(new Error("Aspects unavailable"));
    render(<EditIndexPanel {...config} />);
    await waitFor(() => expect(config.onError).toHaveBeenCalledWith(expect.objectContaining({ error: "Aspects unavailable" })));
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "Draft" } });
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
  });

  it("retains a failed update for retry and cancel through the existing queue", async () => {
    const config = props();
    vi.mocked(config.workerClient!.patchIndex).mockRejectedValueOnce(new Error("Update failed"));
    render(<EditIndexPanel {...config} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "Edited" } });
    await screen.findByRole("button", { name: "Remove Grantor (Party)" });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(queueStoreApi.getState().tasks[0]).toMatchObject({ status: "failed" }));
    expect(config.onClose).toHaveBeenCalledOnce();
    expect(config.onError).not.toHaveBeenCalled();
  });
});
