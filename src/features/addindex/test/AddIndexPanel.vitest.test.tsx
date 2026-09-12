import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { composeMetadataJSON, getPanelData, splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../../queue/store/queueStore";
import { AddIndexPanel } from "../component/AddIndexPanel";
import type { AddIndexPanelProps } from "../type/addIndex.types";

function props(overrides: Partial<AddIndexPanelProps> = {}): AddIndexPanelProps {
  return {
    apiGatewayUrl: "https://gateway.example.com", authToken: "token-1", intervalMs: 0,
    batchCode: "batch-1", retryIntervalMs: 0, retryLimit: 0, segment: "party", session: "session-1",
    selection: { groups: [{ value: { context: ["Selected source"], kind: ["BODY"], token: ["Selected value"] } }], pageNumber: 3 },
    onClose: vi.fn(), onError: vi.fn(), onReadyChange: vi.fn(),
    onResource: vi.fn(async () => ({ aspects: { party: ["grantor", "grantee"], property: ["parcel_id"] } })),
    workerClient: {
      updatePageSegments: vi.fn(), patchIndex: vi.fn(() => new Promise<never>(() => undefined)),
      confirmIndex: vi.fn(), dropIndex: vi.fn(), indexData: vi.fn(async () => ({ indexes: [] })),
      reprocessSegment: vi.fn(), patchStatus: vi.fn(),
    },
    ...overrides,
  };
}

beforeEach(() => {
  queueStoreApi.getState().reset();
  storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [] }));
});

describe("AddIndexPanel", () => {
  it("keeps suggestions closed until focus and supports keyboard selection and Escape", async () => {
    render(<AddIndexPanel {...props()} />);
    const input = screen.getByRole("combobox", { name: "Type" });
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.focus(input);
    await screen.findByRole("option", { name: "Grantor" });
    fireEvent.change(input, { target: { value: "parcel" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const option = screen.getByRole("option", { name: "Parcel Id" });
    expect(input).toHaveAttribute("aria-activedescendant", option.id);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("button", { name: "Remove Parcel Id (Property)" })).toBeVisible();
    expect(input).toHaveValue("");
    expect(screen.queryByRole("option", { name: "Parcel Id" })).toBeNull();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.click(input);
    fireEvent.click(screen.getByRole("textbox", { name: "Index" }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("keeps query text when removing a chip and does not remove chips with nonempty Backspace", async () => {
    render(<AddIndexPanel {...props()} />);
    const input = screen.getByRole("combobox", { name: "Type" });
    fireEvent.focus(input);
    fireEvent.click(await screen.findByRole("option", { name: "Grantor" }));
    fireEvent.change(input, { target: { value: "parcel" } });
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(screen.getByRole("button", { name: "Remove Grantor (Party)" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Remove Grantor (Party)" }));
    expect(input).toHaveValue("parcel");
  });

  it("shows human names and searches all types without a Segment field", async () => {
    const config = props();
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    await screen.findByRole("option", { name: "Parcel Id" });
    expect(config.onResource).toHaveBeenCalledWith({ resource: "aspects" });
    expect(screen.queryByLabelText("Segment")).toBeNull();
    expect(screen.getByRole("group", { name: "Party" })).toBeVisible();
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "PARCEL id" } });
    expect(screen.getByRole("option", { name: "Parcel Id" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "Grantor" })).toBeNull();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("prioritizes context without hiding choices for page context", async () => {
    const config = props({ segment: "property" });
    const { rerender } = render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    await screen.findByRole("option", { name: "Parcel Id" });
    expect(within(screen.getByRole("listbox", { name: "Type suggestions" })).getAllByRole("group")[0]).toHaveAccessibleName("Property");
    rerender(<AddIndexPanel {...config} segment="page" />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(config.onError).not.toHaveBeenCalled();
  });

  it("finds a type among 80 choices and reports no matches", async () => {
    render(<AddIndexPanel {...props({ onResource: vi.fn(async () => ({ aspects: { party: Array.from({ length: 80 }, (_, i) => `aspect_${i + 1}`) } })) })} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    await screen.findByRole("option", { name: "Aspect 80" });
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "aspect_80" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "missing" } });
    expect(screen.getByRole("status")).toHaveTextContent("No matching types");
  });

  it("retains selections through search and removes them individually", async () => {
    render(<AddIndexPanel {...props()} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Grantor" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Type" }), { target: { value: "parcel" } });
    fireEvent.click(screen.getByRole("option", { name: "Parcel Id" }));
    expect(screen.queryByText(/Selected types/)).toBeNull();
    expect(screen.getByRole("button", { name: "Remove Grantor (Party)" }).compareDocumentPosition(screen.getByRole("combobox", { name: "Type" }))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    fireEvent.click(screen.getByRole("button", { name: "Remove Grantor (Party)" }));
    expect(screen.queryByRole("button", { name: "Remove Grantor (Party)" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Parcel Id (Property)" }));
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("removes the last selection with Backspace from empty search", async () => {
    render(<AddIndexPanel {...props()} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Grantor" }));
    fireEvent.click(screen.getByRole("option", { name: "Parcel Id" }));
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Type" }), { key: "Backspace" });
    expect(screen.queryByRole("button", { name: "Remove Parcel Id (Property)" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Type" }), { key: "Backspace" });
    expect(screen.queryByRole("button", { name: "Remove Grantor (Party)" })).toBeNull();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("queues multiple raw aspects across groups with the same edited fields", async () => {
    const config = props();
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Grantor" }));
    fireEvent.click(screen.getByRole("option", { name: "Grantee" }));
    fireEvent.click(screen.getByRole("option", { name: "Parcel Id" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "Edited value" } });
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: " Custom label " } });
    fireEvent.change(screen.getByRole("textbox", { name: "Page Number" }), { target: { value: "7" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Source" }), { target: { value: "Edited source" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(config.onClose).toHaveBeenCalledOnce());
    const tasks = queueStoreApi.getState().tasks;
    expect(tasks.map((task) => task.segment)).toEqual(["party", "property"]);
    expect(tasks.flatMap((task) => task.changes.map((change) => change.patch))).toEqual(
      ["grantor", "grantee", "parcel_id"].map((aspect) => expect.objectContaining({ new_index_aspect: aspect, new_index_label: "Custom label", new_index_value: "Edited value", explanation: "P 7  Edited source" })),
    );
    expect(config.onError).not.toHaveBeenCalled();
  });

  it("distinguishes identical types across groups and keeps Label optional", async () => {
    const config = props({ onResource: vi.fn(async () => ({ aspects: { party: ["name"], property: ["name"] } })) });
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    await screen.findAllByRole("option", { name: "Name" });
    fireEvent.click(within(screen.getByRole("group", { name: "Property" })).getByRole("option"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(config.onClose).toHaveBeenCalledOnce());
    expect(config.workerClient!.patchIndex).toHaveBeenCalledWith("token-1", "session-1", "property", expect.objectContaining({ new_index_aspect: "name", new_index_label: "Name" }));
  });

  it.each(["", "   "])("uses human Type labels for empty Label %j without changing raw aspects or values", async (label) => {
    const config = props();
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Parcel Id" }));
    fireEvent.click(screen.getByRole("option", { name: "Grantor" }));
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Label" }), { target: { value: label } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(config.onClose).toHaveBeenCalledOnce());
    const tasks = queueStoreApi.getState().tasks;
    expect(tasks.flatMap((task) => task.changes.map((change) => change.patch))).toEqual([
      expect.objectContaining({ new_index_aspect: "grantor", new_index_label: "Grantor", new_index_value: "Selected value" }),
      expect.objectContaining({ new_index_aspect: "parcel_id", new_index_label: "Parcel Id", new_index_value: "Selected value" }),
    ]);
    const panel = getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session-1"))!);
    expect(panel.properties).toContainEqual(expect.objectContaining({ aspect: "parcel_id", label: "Parcel Id", value: "Selected value" }));
    expect(panel.parties).toContainEqual(expect.objectContaining({ aspect: "grantor", label: "Grantor" }));
  });

  it("expands compact Advanced fields without losing selection", async () => {
    const config = props();
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Grantor" }));
    const advanced = screen.getByRole("button", { name: "Advanced" });
    expect(advanced).toHaveAttribute("data-state", "closed");
    expect(screen.queryByRole("textbox", { name: "Label" })).toBeNull();
    fireEvent.click(advanced);
    expect(advanced).toHaveAttribute("data-state", "open");
    expect(screen.getByRole("textbox", { name: "Label" })).not.toBeRequired();
    expect(screen.getByRole("textbox", { name: "Page Number" })).toHaveValue("3");
    expect(screen.getByRole("textbox", { name: "Source" })).toHaveValue("Selected source");
    expect(screen.getByRole("textbox", { name: "Source" })).toHaveAttribute("rows", "3");
    expect(screen.getByRole("textbox", { name: "Label" }).parentElement?.parentElement).toBe(screen.getByRole("textbox", { name: "Page Number" }).parentElement?.parentElement);
    fireEvent.click(advanced);
    expect(advanced).toHaveAttribute("data-state", "closed");
    expect(screen.getByRole("button", { name: "Remove Grantor (Party)" })).toBeVisible();
  });

  it("reports resource errors and prevents submission", async () => {
    const config = props({ onResource: vi.fn(async () => { throw new Error("Aspects unavailable"); }) });
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    await waitFor(() => expect(config.onError).toHaveBeenCalledWith(expect.objectContaining({ error: "Aspects unavailable" })));
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("keeps service failures in the queue after closing", async () => {
    const config = props();
    vi.mocked(config.workerClient!.patchIndex).mockRejectedValueOnce(new Error("Index already exists"));
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Grantor" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(queueStoreApi.getState().tasks[0]).toMatchObject({ status: "failed" }));
    expect(config.onClose).toHaveBeenCalledOnce();
    expect(config.onError).not.toHaveBeenCalled();
  });

  it("cancels without queuing", () => {
    const config = props();
    render(<AddIndexPanel {...config} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Type" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(config.onClose).toHaveBeenCalledOnce();
    expect(queueStoreApi.getState().tasks).toEqual([]);
  });
});
