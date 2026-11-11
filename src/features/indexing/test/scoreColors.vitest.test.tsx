import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IqView } from "../../iq/component/IqView";
import { prepareIqReport } from "../../iq/data/iqData";
import { IndexSummary } from "../component/IndexSummary";

const waiting = { data: null, error: null };

afterEach(cleanup);

it.each([
  [-10, 0, 100, "#991b1b", "#ef4444"],
  [0, 0, 100, "#991b1b", "#ef4444"],
  [81, 81, 100, "#991b1b", "#ef4444"],
  [81.5, 163, 200, "#991b1b", "#ef4444"],
  [81.99, 163, 200, "#991b1b", "#ef4444"],
  [82, 82, 100, "#92400e", "#f59e0b"],
  [88, 7, 8, "#92400e", "#f59e0b"],
  [95.5, 191, 200, "#92400e", "#f59e0b"],
  [95.99, 191, 200, "#92400e", "#f59e0b"],
  [96, 96, 100, "#065f46", "#16a34a"],
  [100, 100, 100, "#065f46", "#16a34a"],
  [110, 100, 100, "#065f46", "#16a34a"],
] as const)("matches report number and bar colors for IQ %s and %s/%s gates", (score, passed, total, color, backgroundColor) => {
  const data = { iq_doc: score, gates: Array.from({ length: total }, (_, index) => ({ code: String(index), status: index < passed ? "PASS" : "FAIL", description: `Gate ${index}` })) };
  const view = prepareIqReport(data);
  render(<>
    <IndexSummary metadata={waiting} audit={waiting} iq={{ data, error: null }} />
    <section aria-label="IQ report"><IqView view={view} ackingCodes={new Set()} onAck={vi.fn()} /></section>
  </>);

  const summary = screen.getByRole("region", { name: "Indexing results" });
  for (const [label, percent, reportName] of [["IQ", view.iq.data!.displayInt, "IQ report"], ["Compliance", view.gates.data!.displayPercent, "IQ report"]] as const) {
    const meter = within(summary).getByRole("meter", { name: label });
    expect(meter.parentElement).toHaveStyle({ color });
    expect(meter.firstElementChild).toHaveStyle({ backgroundColor, width: `${percent}%` });
    expect(meter).toHaveAttribute("aria-valuenow", String(percent));
    const number = within(screen.getByRole("region", { name: reportName })).getAllByText(`${percent}%`, { exact: true })[label === "IQ" ? 0 : 1];
    expect(number).toHaveStyle({ color });
    const fill = number.parentElement!.nextElementSibling!.lastElementChild!.firstElementChild!;
    expect(fill).toHaveStyle({ backgroundColor });
  }
});

it("colors IQ and compliance independently and preserves mixed gate calculations", () => {
  const data = { iq_doc: 100, gates: ["PASS", "FAIL", "WARNING", "INFO", "OTHER"].map(status => ({ code: status, status })) };
  render(<IndexSummary metadata={waiting} audit={waiting} iq={{ data, error: null }} />);
  const iq = screen.getByRole("meter", { name: "IQ" });
  const gates = screen.getByRole("meter", { name: "Compliance" });
  expect(iq.parentElement).toHaveStyle({ color: "#065f46" });
  expect(iq.firstElementChild).toHaveStyle({ backgroundColor: "#16a34a", width: "100%" });
  expect(gates.parentElement).toHaveStyle({ color: "#991b1b" });
  expect(gates.firstElementChild).toHaveStyle({ backgroundColor: "#ef4444", width: "67%" });
  expect(gates).toHaveAttribute("aria-valuenow", "67");
});

it("updates colors on new results and removes meters for pending and failed reports", () => {
  const result = (score: number) => ({ data: { iq_doc: score, gates: [] }, error: null });
  const view = render(<IndexSummary metadata={waiting} audit={waiting} iq={waiting} />);
  expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  for (const [score, color, backgroundColor] of [[100, "#065f46", "#16a34a"], [88, "#92400e", "#f59e0b"], [50, "#991b1b", "#ef4444"]] as const) {
    view.rerender(<IndexSummary metadata={waiting} audit={waiting} iq={result(score)} />);
    const meter = screen.getByRole("meter", { name: "IQ" });
    expect(meter.parentElement).toHaveStyle({ color });
    expect(meter.firstElementChild).toHaveStyle({ backgroundColor });
    const gates = screen.getByRole("meter", { name: "Compliance" });
    expect(gates).toHaveAttribute("aria-valuenow", "0");
    expect(gates.parentElement).toHaveStyle({ color: "#991b1b" });
    expect(gates.firstElementChild).toHaveStyle({ backgroundColor: "#ef4444", width: "0%" });
  }
  view.rerender(<IndexSummary metadata={waiting} audit={waiting} iq={{ ...result(100), error: "Report unavailable" }} />);
  expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  for (const label of ["IQ", "Compliance"]) expect(screen.getByRole("button", { name: `${label} error` })).toBeVisible();
  view.rerender(<IndexSummary metadata={waiting} audit={waiting} iq={waiting} />);
  expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  view.rerender(<IndexSummary metadata={waiting} audit={waiting} iq={result(100)} />);
  expect(screen.getByRole("meter", { name: "IQ" }).firstElementChild).toHaveStyle({ backgroundColor: "#16a34a" });
});
