import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    { code: "info", status: "info", description: "Info gate", isFailure: false },
  ],
  total: 2,
  success: 1,
  ratio: 50,
  displayPercent: 50,
  bucket: "red",
  decision: "Reject",
};

describe("IqGates", () => {
  afterEach(() => vi.useRealTimers());
  it("uses colored dots while retaining gate labels and actions", () => {
    render(<IqGates ackingCodes={new Set()} gates={gates} onAck={vi.fn()} />);
    const pass = document.querySelector('[data-gate-code="pass"]')!;
    expect(pass.querySelector('svg[data-status-icon="success"] circle')).toHaveAttribute("r", "12");
    expect(pass.querySelector("svg")).toHaveStyle({ color: "#15803d" });
    expect(pass).toHaveTextContent("PASS");
    for (const code of ["fail", "warning", "info"]) {
      const row = document.querySelector(`[data-gate-code="${code}"]`)!;
      expect(row.querySelector('svg[data-status-icon="success"]')).toBeNull();
      expect(row).toHaveTextContent(code.toUpperCase());
      expect(row.querySelector('span[aria-hidden="true"]')).toHaveStyle({ borderRadius: "999px", height: "0.7rem", width: "0.7rem" });
    }
    expect(document.querySelector('[data-gate-code="warning"] span[aria-hidden="true"]')).toHaveStyle({ background: "#f59e0b" });
    expect(document.querySelector('[data-gate-code="fail"] span[aria-hidden="true"]')).toHaveStyle({ background: "#ef4444" });
  });

  it("renders metric and clear actions", () => {
    render(<IqGates ackingCodes={new Set()} gates={gates} onAck={vi.fn()} />);

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("out of 2 gates")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Clear gate" })).toHaveLength(2);
    for (const button of screen.getAllByRole("button", { name: "Clear gate" })) {
      expect(button).toHaveTextContent(/^$/);
      expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(button).toHaveStyle({ width: "2rem", height: "2rem", padding: "0" });
    }
    expect(within(screen.getByText("Info gate").closest("li")!).queryByRole("button")).toBeNull();
    expect(screen.getByText("PASS")).toBeInTheDocument();
    expect(screen.getByText("Notary Name must be present - none were found in the available values.")).toBeInTheDocument();

    const passRow = screen.getByText("Pass gate").closest("[data-gate-code='pass']") as HTMLElement | null;
    const failRow = screen.getByText("Notary Name must be present - none were found in the available values.").closest("[data-gate-code='fail']") as HTMLElement | null;
    const warningRow = screen.getByText("Warning gate").closest("[data-gate-code='warning']") as HTMLElement | null;

    expect(passRow && within(passRow).queryByRole("button", { name: "Clear gate" })).toBeNull();
    expect(failRow && within(failRow).getByRole("button", { name: "Clear gate" })).toBeInTheDocument();
    expect(warningRow && within(warningRow).getByRole("button", { name: "Clear gate" })).toBeInTheDocument();
  });

  it.each(["fail", "warning"])("confirms only the selected %s gate", (code) => {
    const onAck = vi.fn();
    render(<IqGates ackingCodes={new Set()} gates={gates} onAck={onAck} />);

    const clear = within(document.querySelector(`[data-gate-code='${code}']`) as HTMLElement).getByRole("button", { name: "Clear gate" });
    fireEvent.click(clear);
    expect(onAck).not.toHaveBeenCalled();
    expect(clear).toHaveAccessibleName("Confirm");
    expect(clear).toHaveTextContent(/^$/);
    expect(clear.querySelector("svg")).toBeInTheDocument();
    expect(clear.querySelector("[data-confirm-progress]")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Clear gate" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onAck).toHaveBeenCalledExactlyOnceWith(code);
    expect(clear).toHaveAccessibleName("Clear gate");
  });

  it("expires confirmation after four seconds without clearing a gate", () => {
    vi.useFakeTimers();
    const onAck = vi.fn();
    render(<IqGates ackingCodes={new Set()} gates={gates} onAck={onAck} />);
    const clear = screen.getAllByRole("button", { name: "Clear gate" })[0];
    fireEvent.click(clear);
    act(() => vi.advanceTimersByTime(4000));
    expect(clear).toHaveAccessibleName("Clear gate");
    expect(clear.querySelector("[data-confirm-progress]")).toBeNull();
    expect(onAck).not.toHaveBeenCalled();
    fireEvent.click(clear);
    expect(clear).toHaveAccessibleName("Confirm");
    expect(onAck).not.toHaveBeenCalled();
  });

  it("disables acking clear action and renders empty gates", () => {
    const onAck = vi.fn();
    const { rerender } = render(<IqGates ackingCodes={new Set(["fail"])} gates={gates} onAck={onAck} />);

    expect(screen.getAllByRole("button", { name: "Clear gate" })[0]).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear gate" })[0]);
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(onAck).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Clear gate" })[1]).toBeEnabled();

    rerender(<IqGates ackingCodes={new Set()} gates={{ ...gates, items: [], total: 0, success: 0, ratio: 0, displayPercent: 0, decision: "Review" }} onAck={vi.fn()} />);
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});
