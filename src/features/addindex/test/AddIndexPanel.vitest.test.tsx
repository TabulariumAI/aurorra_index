import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddIndexPanel } from "../component/AddIndexPanel";
import type {
  AddIndexPanelProps,
  AddIndexSelection,
  AddIndexWorkerClient,
} from "../type/addIndex.types";

const firstContext = "JOHN SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385 PARTY OF THE FIRST PART, AND";
const secondContext = "JOHN M. SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385, AS TRUSTEE OF THE JOHN M. SMITH LIVING TRUST, DATED JUNE 9, 2025";
const selection: AddIndexSelection = {
  groups: [
    { value: { context: [firstContext], kind: ["BODY"], token: ["JOHN", "SMITH,"] } },
    { value: { context: [firstContext], kind: ["BODY"], token: ["JOHN SMITH"] } },
    { value: { context: ["JOHN SMITH"], kind: ["BODY"], token: ["JOHN SMITH"] } },
    { value: { context: [secondContext], kind: ["BODY"], token: ["JOHN M. SMITH"] } },
  ],
  pageNumber: 3,
};

function props(overrides: Partial<AddIndexPanelProps> = {}): AddIndexPanelProps {
  return {
    apiGatewayUrl: "https://gateway.example.com",
    authToken: "token-1",
    onClose: vi.fn(),
    onComplete: vi.fn(),
    onError: vi.fn(),
    onReadyChange: vi.fn(),
    intervalMs: 0,
    segment: "party",
    selection,
    session: "session-1",
    workerClient: {
      addIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 3 })),
      patchStatus: vi.fn(),
    },
    ...overrides,
  };
}

describe("AddIndexPanel", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders editable Add Index content with one Quote group", () => {
    render(<AddIndexPanel {...props()} />);

    const form = screen.getByRole("region", { name: "Add selected index form" });
    expect(form).toHaveStyle({ gap: "1rem" });
    expect(form.style.margin).toBe("");
    expect(form.style.maxWidth).toBe("");
    expect(form.style.padding).toBe("");
    expect(form.style.overflowY).toBe("");
    expect(form.querySelector("h2")).toBeNull();
    const indexField = screen.getByTestId("add-index-field");
    const quoteField = screen.getByTestId("add-quote-field");
    const typeField = screen.getByTestId("add-type-field");
    expect(indexField).toHaveStyle({
      background: "var(--white)",
      borderRadius: "var(--radius-card)",
      padding: "0.6rem 0.75rem",
    });
    expect(quoteField).toHaveStyle({
      background: "var(--white)",
      borderRadius: "var(--radius-card)",
      padding: "0.6rem 0.75rem",
    });
    expect(typeField).toHaveStyle({
      background: "var(--white)",
      borderRadius: "var(--radius-card)",
      padding: "0.6rem 0.75rem",
    });
    expect(indexField.compareDocumentPosition(quoteField)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(quoteField.compareDocumentPosition(typeField)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole("group", { name: "Quote" })).toBe(quoteField);

    const indexInput = screen.getByRole("textbox", { name: "Index" });
    const pageInput = screen.getByRole("textbox", { name: "Page Number" });
    const sourceInput = screen.getByRole("textbox", { name: "Source" });
    const typeInput = screen.getByRole("textbox", { name: "Type" });
    expect(indexInput).toHaveAttribute("type", "text");
    expect(indexInput).toHaveValue("JOHN SMITH JOHN M. SMITH");
    expect(pageInput).toHaveValue("3");
    expect(sourceInput).toHaveValue(`${firstContext}\n\n${secondContext}`);
    expect(typeInput).toBeRequired();
    expect(typeInput).toHaveValue("");
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("closes before posting the edited service request and emits host job events", async () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();
    const addIndex = vi.fn(async () => ({ data: "", status: "completed" as const, version: 3 }));
    const workerClient: AddIndexWorkerClient = {
      addIndex,
      patchStatus: vi.fn(),
    };
    render(<AddIndexPanel {...props({ onClose, onComplete, onError, workerClient })} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Index" }), { target: { value: "Edited Index" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Page Number" }), { target: { value: "7" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Source" }), { target: { value: "Edited source" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Type" }), { target: { value: "  Party  " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveAttribute("data-armed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(workerClient.addIndex).toHaveBeenCalledWith("token-1", "session-1", {
      aspect: "Party",
      explanation: "P 7  Edited source",
      label: "Party",
      segment: "party",
      value: "Edited Index",
    }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(addIndex.mock.invocationCallOrder[0]);
    expect(onComplete).toHaveBeenCalledWith({
      aspect: "Party",
      explanation: "P 7  Edited source",
      label: "Party",
      session: "session-1",
      segment: "party",
      value: "Edited Index",
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it("closes before a rejected service response and emits failure to the host", async () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();
    const serviceError = Object.assign(new Error("Index already exists."), {
      code: "index_not_added",
      details: { accepted: false, description: "Index already exists." },
      status: 200,
    });
    const workerClient: AddIndexWorkerClient = {
      addIndex: vi.fn(async () => {
        throw serviceError;
      }),
      patchStatus: vi.fn(),
    };
    render(<AddIndexPanel {...props({ onClose, onComplete, onError, workerClient })} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Type" }), { target: { value: "Party" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith({
      code: "index_not_added",
      details: { accepted: false, description: "Index already exists." },
      error: "Index already exists.",
      status: 200,
    }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("waits for the patch to complete before emitting completion", async () => {
    const onComplete = vi.fn();
    const workerClient: AddIndexWorkerClient = {
      addIndex: vi.fn(async () => ({ data: "", status: "processing" as const, version: 3 })),
      patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 3 })),
    };
    render(<AddIndexPanel {...props({ intervalMs: 0, onComplete, workerClient })} />);

    fireEvent.change(screen.getByRole("textbox", { name: "Type" }), { target: { value: "Party" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(workerClient.patchStatus).toHaveBeenCalledWith("token-1", "session-1", 3));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("closes without submitting", () => {
    const onClose = vi.fn();
    const workerClient: AddIndexWorkerClient = {
      addIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 3 })),
      patchStatus: vi.fn(),
    };
    render(<AddIndexPanel {...props({ onClose, workerClient })} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(workerClient.addIndex).not.toHaveBeenCalled();
  });
});
