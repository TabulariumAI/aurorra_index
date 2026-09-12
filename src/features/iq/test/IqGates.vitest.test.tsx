import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IqGates } from "../component/IqGates";
import type { IqReportView } from "../type/iq.types";

const gates: IqReportView["gates"] = {
  items: [
    { code: "pass", status: "success", description: "Pass gate", isFailure: false },
    {
      code: "fail",
      status: "fail",
      description: "Notary Name must be present - none were found in the available values.",
      isFailure: true,
    },
    { code: "warning", status: "warning", description: "Warning gate", isFailure: false },
  ],
  total: 2,
  success: 1,
  ratio: 50,
  displayPercent: 50,
  bucket: "red",
  decision: "Reject",
};

describe("IqGates", () => {
  it("renders metric and clear actions", () => {
    render(<IqGates ackingCodes={new Set()} gates={gates} onAck={vi.fn()} />);

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("out of 2 gates")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Clear gate" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Clear gate" })[0]).toHaveTextContent("Clear gate");
    expect(screen.getByText("PASS")).toBeInTheDocument();
    expect(screen.getByText("Notary Name must be present - none were found in the available values.")).toBeInTheDocument();

    const passRow = screen.getByText("Pass gate").closest("[data-gate-code='pass']") as HTMLElement | null;
    const failRow = screen.getByText("Notary Name must be present - none were found in the available values.").closest("[data-gate-code='fail']") as HTMLElement | null;
    const warningRow = screen.getByText("Warning gate").closest("[data-gate-code='warning']") as HTMLElement | null;

    expect(passRow && within(passRow).queryByRole("button", { name: "Clear gate" })).toBeNull();
    expect(failRow && within(failRow).getByRole("button", { name: "Clear gate" })).toBeInTheDocument();
    expect(warningRow && within(warningRow).getByRole("button", { name: "Clear gate" })).toBeInTheDocument();
  });

  it("calls onAck through clear action", () => {
    const onAck = vi.fn();
    render(<IqGates ackingCodes={new Set()} gates={gates} onAck={onAck} />);

    const clear = screen.getAllByRole("button", { name: "Clear gate" })[0];
    fireEvent.click(clear);
    expect(clear).toHaveAccessibleName("Confirm");
    expect(clear).toHaveTextContent("Clear gate");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onAck).toHaveBeenCalledWith("fail");
  });

  it("disables acking clear action and renders empty gates", () => {
    const { rerender } = render(<IqGates ackingCodes={new Set(["fail"])} gates={gates} onAck={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: "Clear gate" })[0]).toBeDisabled();

    rerender(<IqGates ackingCodes={new Set()} gates={{ ...gates, items: [], total: 0, success: 0, ratio: 0, displayPercent: 0, decision: "Review" }} onAck={vi.fn()} />);
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});
