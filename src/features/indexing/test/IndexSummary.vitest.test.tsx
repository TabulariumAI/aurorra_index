import * as auditData from "../../audit/data/auditData";
import * as iqData from "../../iq/data/iqData";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IndexSummary } from "../component/IndexSummary";

const waiting = { data: null, error: null };
const iq = { data: { iq_doc: 89.6, gates: [{ code: "a", status: "PASS" }, { code: "b", status: "FAIL" }, { code: "c", status: "WARNING" }, { code: "d", status: "INFO" }] }, error: null };
const audit = { data: { gaps: [{ solution: "add", owner: "enrichment", explanation: "Added", page: "1", timestamp: "", segment: null }, { solution: "correction", owner: "user", explanation: "Changed", page: "1", timestamp: "", segment: null }] }, error: null };
const metadata = { data: { indexes: [{ code: "same", segment: "party", ambiguous: "NO" }, { code: "ref", ambiguous: "YES" }, { code: "execution", ambiguous: "YES" }], parties: { indexes: [{ code: "same", ambiguous: "YES" }] }, execution: { indexes: [{ code: "execution", ambiguous: "NO" }] } }, error: null };
const value = (label: string) => screen.getByText(label, { exact: true }).closest("div")!.querySelector("dd")!;

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

it("shows five summary metrics with existing count and score semantics and no report details", () => {
  render(<IndexSummary metadata={metadata} audit={audit} iq={iq} />);
  expect(value("Indexes")).toHaveTextContent("3");
  expect(value("Ambiguities")).toHaveTextContent("3");
  expect(value("Audit changes")).toHaveTextContent("2");
  expect(value("IQ")).toHaveTextContent("90%");
  expect(value("Compliance")).toHaveTextContent("75%");
  expect(screen.queryByText("Added")).not.toBeInTheDocument();
  expect(screen.queryByText("Compliance Gates")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("resolves resources independently and keeps named placeholders for pending metrics", async () => {
  vi.useFakeTimers();
  const view = render(<IndexSummary metadata={waiting} audit={waiting} iq={waiting} />);
  await act(() => vi.advanceTimersByTimeAsync(1000));
  for (const label of ["Indexes", "Ambiguities", "Audit changes", "IQ", "Compliance"]) {
    expect(within(value(label)).getByRole("status")).toHaveAttribute("aria-busy", "true");
  }
  view.rerender(<IndexSummary metadata={waiting} audit={audit} iq={iq} />);
  expect(value("IQ")).toHaveTextContent("90%");
  expect(value("Audit changes")).toHaveTextContent("2");
  expect(within(value("Indexes")).getByRole("status")).toBeVisible();
  view.rerender(<IndexSummary metadata={metadata} audit={audit} iq={iq} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("preserves successful results when another resource fails", () => {
  render(<IndexSummary metadata={metadata} audit={{ data: null, error: "Audit unavailable" }} iq={iq} />);
  expect(value("Indexes")).toHaveTextContent("3");
  expect(value("IQ")).toHaveTextContent("90%");
  expect(within(value("Audit changes")).getByRole("button", { name: "Audit changes error" })).toBeVisible();
});

it.each([undefined, []])("shows zero counts for empty metadata and audit", indexes => {
  render(<IndexSummary metadata={{ data: { indexes }, error: null }} audit={{ data: { gaps: [] }, error: null }} iq={iq} />);
  for (const label of ["Indexes", "Ambiguities", "Audit changes"]) expect(value(label)).toHaveTextContent(/^0$/);
});

it("prefers enriched parties and deduplicates execution records using the established order", () => {
  render(<IndexSummary metadata={{ data: { indexes: [{ code: "a", ambiguous: "NO" }], parties: { indexes: [{ code: "a", ambiguous: "YES" }, { code: "a", ambiguous: "YES" }] }, execution: { indexes: [{ code: "b", ambiguous: "YES" }, { code: "b", ambiguous: "YES" }] } }, error: null }} audit={audit} iq={iq} />);
  expect(value("Indexes")).toHaveTextContent(/^2$/);
  expect(value("Ambiguities")).toHaveTextContent(/^2$/);
});

it("contains malformed metadata summary data without losing audit or IQ", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<IndexSummary metadata={{ data: { parties: { indexes: {} } }, error: null }} audit={audit} iq={iq} />);
  expect(screen.getByRole("button", { name: "Indexes error" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Ambiguities error" })).toBeVisible();
  expect(screen.getAllByRole("term")).toHaveLength(5);
  expect(value("Audit changes")).toHaveTextContent("2");
  expect(value("IQ")).toHaveTextContent("90%");
  vi.restoreAllMocks();
});

it.each(["party", "reference", "property", "monetary", "acknowledgment", "transaction", "vital", "judgment", "endorsement"])("counts unique %s codes and retains equal values with distinct codes", segment => {
  const first = { code: "first", segment, value: "Same", ambiguous: "NO" };
  render(<IndexSummary metadata={{ data: { indexes: [first, { ...first, page: "2", ambiguous: "YES" }, { ...first, code: "second", ambiguous: "YES" }] }, error: null }} audit={audit} iq={iq} />);
  expect(value("Indexes")).toHaveTextContent(/^2$/);
  expect(value("Ambiguities")).toHaveTextContent(/^1$/);
});

it("uses the existing ambiguity predicates and counts separate parties without raw indexes", () => {
  const indexes = ["YES", "y", true, 1, "NO", false, null, undefined].map((ambiguous, code) => ({ code: String(code), ambiguous }));
  const view = render(<IndexSummary metadata={{ data: { indexes }, error: null }} audit={audit} iq={iq} />);
  expect(value("Indexes")).toHaveTextContent(/^8$/);
  expect(value("Ambiguities")).toHaveTextContent(/^4$/);
  view.rerender(<IndexSummary metadata={{ data: { parties: { indexes: [{ code: "party", ambiguous: "YES" }] } }, error: null }} audit={audit} iq={iq} />);
  expect(value("Indexes")).toHaveTextContent(/^1$/);
  expect(value("Ambiguities")).toHaveTextContent(/^1$/);
});

it("contains Audit calculation failures and retains all five metric labels", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(auditData, "prepareAuditReport").mockImplementation(() => { throw new TypeError("Audit calculation failed"); });
  expect(() => render(<IndexSummary metadata={metadata} audit={audit} iq={iq} />)).not.toThrow();
  expect(screen.getByRole("button", { name: "Audit changes error" })).toBeVisible();
  expect(screen.getAllByRole("term")).toHaveLength(5);
  expect(value("IQ")).toHaveTextContent("90%");
});

it("contains IQ calculation failures and retains both score labels", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(iqData, "prepareIqReport").mockImplementation(() => { throw new TypeError("IQ calculation failed"); });
  render(<IndexSummary metadata={metadata} audit={audit} iq={iq} />);
  expect(screen.getByRole("button", { name: "IQ error" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Compliance error" })).toBeVisible();
  expect(screen.getAllByRole("term")).toHaveLength(5);
  expect(value("Audit changes")).toHaveTextContent("2");
});

it("renders an error indicator for an empty error message instead of an endless placeholder", () => {
  render(<IndexSummary metadata={metadata} audit={{ data: null, error: "" }} iq={iq} />);
  expect(within(value("Audit changes")).getByRole("button", { name: "Audit changes error" })).toBeVisible();
  expect(within(value("Audit changes")).queryByRole("status")).not.toBeInTheDocument();
});

it("exposes named score meters matching the displayed percentages", () => {
  render(<IndexSummary metadata={metadata} audit={audit} iq={iq} />);
  for (const [label, percent] of [["IQ", 90], ["Compliance", 75]] as const) {
    const meter = screen.getByRole("meter", { name: label });
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("aria-valuenow", String(percent));
    expect(meter).toHaveAttribute("aria-valuetext", `${percent}%`);
    expect(meter.firstElementChild).toHaveStyle({ width: `${percent}%` });
    expect(value(label)).toHaveTextContent(`${percent}%`);
  }
  expect(screen.getAllByRole("meter")).toHaveLength(2);
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

it.each([[-5, 0], [0, 0], [49.6, 50], [100, 100], [110, 100]])("uses existing IQ normalization for %s without changing its score", (score, percent) => {
  render(<IndexSummary metadata={metadata} audit={audit} iq={{ data: { iq_doc: score, gates: [] }, error: null }} />);
  expect(screen.getByRole("meter", { name: "IQ" })).toHaveAttribute("aria-valuenow", String(percent));
  expect(screen.getByRole("meter", { name: "Compliance" })).toHaveAttribute("aria-valuenow", "0");
  expect(value("IQ")).toHaveTextContent(`${percent}%`);
});

it("removes score meters while IQ is pending or failed and restores them on success", () => {
  const view = render(<IndexSummary metadata={metadata} audit={audit} iq={waiting} />);
  expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  view.rerender(<IndexSummary metadata={metadata} audit={audit} iq={iq} />);
  expect(screen.getAllByRole("meter")).toHaveLength(2);
  view.rerender(<IndexSummary metadata={metadata} audit={audit} iq={{ ...iq, error: "IQ unavailable" }} />);
  expect(screen.queryByRole("meter")).not.toBeInTheDocument();
  for (const label of ["IQ", "Compliance"]) expect(screen.getByRole("button", { name: `${label} error` })).toBeVisible();
  expect(value("Indexes")).toHaveTextContent("3");
  view.rerender(<IndexSummary metadata={metadata} audit={audit} iq={iq} />);
  expect(screen.getByRole("meter", { name: "IQ" })).toHaveAttribute("aria-valuenow", "90");
});

it("places count labels before their values without reversing the visual order", () => {
  render(<IndexSummary metadata={metadata} audit={audit} iq={iq} />);
  for (const label of ["Indexes", "Ambiguities", "Audit changes"]) {
    const term = screen.getByText(label, { exact: true });
    expect(term.nextElementSibling).toBe(value(label));
    expect(getComputedStyle(term.parentElement!).flexDirection).toBe("row");
    expect(getComputedStyle(term.parentElement!).justifyContent).toBe("space-between");
  }
  for (const label of ["IQ", "Compliance"]) {
    expect(value(label).parentElement).toHaveStyle({ flexDirection: "column" });
  }
});
