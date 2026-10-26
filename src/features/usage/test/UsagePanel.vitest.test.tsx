import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { UsagePanel } from "../component/UsagePanel";
import type { UsageRecord } from "../type/usage.types";

const names = { extraction: "Index Extraction", iq_refinement: "IQ Refinement", refinement: "User Refinement", model_generation: "Model Generation" };
const records: UsageRecord[] = [
  { session: "one", code: "a", name: "extraction", cost: 11, page_num: 1, timestamp: "2026-10-04T12:00:00Z" },
  { session: "two", code: "b", name: "extraction", cost: 22, page_num: 10, timestamp: "2026-10-05T12:00:00Z" },
  { session: "one", code: "c", name: "iq_refinement", cost: 5.5, page_num: 2, timestamp: "2026-10-05T12:00:00Z" },
  { session: "one", code: "d", name: "refinement", cost: 2, page_num: 1, timestamp: "2026-10-05T12:00:00Z" },
  { session: "one", code: "e", name: "model_generation", cost: 3, page_num: 0, timestamp: "2026-10-05T12:00:00Z" },
];

afterEach(() => { cleanup(); vi.useRealTimers(); });

function showUsage(data = records) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));
  render(<UsagePanel records={data} />);
}

function selectServices(selected: UsageRecord["name"][]) {
  const trigger = screen.getByRole("button", { name: "Service" });
  fireEvent.click(trigger);
  for (const name of selected) {
    const option = screen.getByRole("checkbox", { name: names[name] });
    if (option.getAttribute("aria-checked") !== "true") fireEvent.click(option);
  }
  for (const name of Object.keys(names) as UsageRecord["name"][]) {
    const option = screen.getByRole("checkbox", { name: names[name] });
    if (!selected.includes(name) && option.getAttribute("aria-checked") === "true") fireEvent.click(option);
  }
  fireEvent.keyDown(screen.getByRole("checkbox", { name: names[selected[0]] }), { key: "Escape" });
}

it("combines only Index Extraction and IQ Refinement, with separate User Refinement and Model Generation charts", () => {
  showUsage();
  expect(screen.getAllByRole("img")).toHaveLength(3);
  const group = screen.getByRole("region", { name: "Index Extraction and IQ Refinement usage" });
  const chart = within(group).getByRole("img", { name: "Index Extraction and IQ Refinement daily cost chart" });
  const totals = within(group).getByRole("region", { name: "Totals usage" });
  expect(within(totals).getByText("Service cost").nextElementSibling).toHaveTextContent("$38.5000");
  expect(within(totals).getByText("Average page cost").nextElementSibling).toHaveTextContent("$5.7500");
  expect(within(totals).queryByText("Sessions")).not.toBeInTheDocument();
  expect(within(totals).queryByText("Pages used")).not.toBeInTheDocument();
  const extractionSummary = within(group).getByRole("region", { name: "Index Extraction usage" });
  expect(extractionSummary.parentElement!.firstElementChild).toBe(totals);
  expect(totals.nextElementSibling).toBe(extractionSummary);
  expect(within(totals).getByRole("heading", { name: "Totals" })).toHaveAttribute("style", within(extractionSummary).getByRole("heading", { name: "Index Extraction" }).getAttribute("style")!);
  for (const label of ["Service cost", "Average page cost"]) {
    expect(within(totals).getByText(label)).toHaveAttribute("style", within(extractionSummary).getByText(label).getAttribute("style")!);
    expect(within(totals).getByText(label).nextElementSibling).toHaveAttribute("style", within(extractionSummary).getByText(label).nextElementSibling!.getAttribute("style")!);
  }
  expect(within(group).queryByRole("region", { name: "Model Generation usage" })).not.toBeInTheDocument();
  expect(within(group).queryByRole("region", { name: "User Refinement usage" })).not.toBeInTheDocument();
  expect(chart.querySelectorAll("rect")).toHaveLength(6);
  expect(new Set([...chart.querySelectorAll("rect")].map(bar => bar.getAttribute("fill"))).size).toBe(3);
  expect(within(chart).getByText("Total 2026-10-05: $27.5000").parentElement).toHaveAttribute("fill", "#dc2626");
  expect(within(chart).getByText("IQ Refinement 2026-10-04: $0.0000, 0 pages").parentElement).toHaveAttribute("height", "0");
  const extraction = within(chart).getByText("Index Extraction 2026-10-05: $22.0000, 10 pages").parentElement!;
  const iq = within(chart).getByText("IQ Refinement 2026-10-05: $5.5000, 2 pages").parentElement!;
  expect(extraction).toHaveAttribute("fill", "var(--primary)");
  expect(iq).toHaveAttribute("fill", "var(--primary-light)");
  expect(within(group).getByRole("heading", { name: "Index Extraction" }).firstElementChild).toHaveStyle({ background: "var(--primary)" });
  expect(within(group).getByRole("heading", { name: "IQ Refinement" }).firstElementChild).toHaveStyle({ background: "var(--primary-light)" });
  expect(Number(extraction.getAttribute("height"))).toBeCloseTo(Number(iq.getAttribute("height")) * 4);
  const bars = [...chart.querySelectorAll("rect")];
  for (let offset = 0; offset < bars.length; offset += 3) {
    const [total, extraction, iq] = bars.slice(offset, offset + 3);
    expect(total.querySelector("title")!.textContent).toMatch(/^Total /);
    expect(extraction.querySelector("title")!.textContent).toMatch(/^Index Extraction /);
    expect(iq.querySelector("title")!.textContent).toMatch(/^IQ Refinement /);
    const centers = [total, extraction, iq].map(bar => Number(bar.getAttribute("x")) + Number(bar.getAttribute("width")) / 2);
    expect(centers[1]).toBeCloseTo(centers[0]);
    expect(centers[2]).toBeCloseTo(centers[0]);
    expect(total.getAttribute("width")).toBe(extraction.getAttribute("width"));
    expect(extraction.getAttribute("width")).toBe(iq.getAttribute("width"));
    expect(total.getAttribute("x")).toBe(extraction.getAttribute("x"));
    expect(extraction.getAttribute("x")).toBe(iq.getAttribute("x"));
  }
  for (const name of ["User Refinement", "Model Generation"]) {
    const service = screen.getByRole("region", { name: `${name} usage` });
    expect(within(service).getByRole("img", { name: `${name} daily cost chart` })).toBeInTheDocument();
    expect(within(service).queryByRole("region", { name: "Totals usage" })).not.toBeInTheDocument();
    expect(within(service).getByRole("img").querySelectorAll("rect")).toHaveLength(1);
  }
});

it.each([
  [["extraction"], "$33.0000", 1],
  [["iq_refinement"], "$5.5000", 1],
  [["extraction", "model_generation"], "$33.0000", 2],
  [["iq_refinement", "refinement"], "$5.5000", 2],
  [["refinement", "model_generation"], null, 2],
] as const)("filters %s while excluding unrelated services from the combined Total", (selected, total, charts) => {
  showUsage();
  selectServices([...selected]);
  expect(screen.getAllByRole("img")).toHaveLength(charts);
  for (const [key, label] of Object.entries(names)) {
    expect(screen.queryByRole("region", { name: `${label} usage` }) !== null).toBe(selected.some(name => name === key));
  }
  if (total === null) expect(screen.queryByRole("region", { name: "Totals usage" })).not.toBeInTheDocument();
  else {
    const totals = screen.getByRole("region", { name: "Totals usage" });
    expect(within(totals).getByText("Service cost").nextElementSibling).toHaveTextContent(total);
    const average = selected.some(name => name === "extraction") ? "$3.0000" : "$2.7500";
    expect(within(totals).getByText("Average page cost").nextElementSibling).toHaveTextContent(average);
  }
});

it("preserves distinct sessions, pages, weighted averages, UTC date limits and weekly buckets", () => {
  showUsage();
  const extraction = screen.getByRole("region", { name: "Index Extraction usage" });
  expect(within(extraction).getByText("Sessions").nextElementSibling).toHaveTextContent("2");
  expect(within(extraction).getByText("Pages used").nextElementSibling).toHaveTextContent("11");
  expect(within(extraction).getByText("$3.0000")).toBeInTheDocument();
  expect(screen.getByLabelText("From")).toHaveAttribute("min", "2026-09-01");
  expect(screen.getByLabelText("To")).toHaveAttribute("max", "2026-10-31");
  fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-10-05" } });
  expect(within(extraction).getByText("Sessions").nextElementSibling).toHaveTextContent("1");
  expect(within(extraction).getByText("Service cost").nextElementSibling).toHaveTextContent("$22.0000");
  expect(within(extraction).getByText("$2.2000")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "Totals usage" })).getByText("Service cost").nextElementSibling).toHaveTextContent("$27.5000");
  fireEvent.change(screen.getByLabelText("Period"), { target: { value: "weekly" } });
  expect(screen.getByRole("img", { name: "Index Extraction and IQ Refinement weekly cost chart" })).toBeInTheDocument();
  expect(screen.getByText("Total 2026-10-05: $27.5000")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Model Generation weekly cost chart" })).toBeInTheDocument();
});

it("merges weekly costs from different days and keeps service colors stable when filtering", () => {
  showUsage(records.map(row => row.name === "iq_refinement" ? { ...row, timestamp: "2026-10-06T00:30:00Z" } : row));
  const color = screen.getByText("IQ Refinement 2026-10-06: $5.5000, 2 pages").parentElement!.getAttribute("fill");
  fireEvent.change(screen.getByLabelText("Period"), { target: { value: "weekly" } });
  expect(screen.getByText("Total 2026-10-05: $27.5000")).toBeInTheDocument();
  selectServices(["iq_refinement", "model_generation"]);
  expect(screen.getByText("IQ Refinement 2026-10-05: $5.5000, 2 pages").parentElement).toHaveAttribute("fill", color!);
  expect(within(screen.getByRole("region", { name: "Totals usage" })).getByText("Service cost").nextElementSibling).toHaveTextContent("$5.5000");
  fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-10-05" } });
  expect(screen.queryByRole("region", { name: "Index Extraction and IQ Refinement usage" })).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Model Generation weekly cost chart" })).toBeInTheDocument();
});

it("renders finite zero-cost bars and keeps no-page metrics for page services", () => {
  showUsage(records.map(row => ({ ...row, cost: 0, page_num: 0 })));
  expect(screen.getAllByText("No pages used")).toHaveLength(4);
  expect(within(screen.getByRole("region", { name: "Totals usage" })).getByText("Service cost").nextElementSibling).toHaveTextContent("$0.0000");
  for (const chart of screen.getAllByRole("img")) for (const bar of chart.querySelectorAll("rect")) {
    expect(bar).toHaveAttribute("height", "0");
    expect(Number.isFinite(Number(bar.getAttribute("x")))).toBe(true);
    expect(Number.isFinite(Number(bar.getAttribute("y")))).toBe(true);
  }
  fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-10-06" } });
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("No usage in the selected period.")).toBeInTheDocument();
});

it("uses a collapsed service dropdown, exposes checks, and prevents removal of the final service", async () => {
  render(<UsagePanel records={[]} />);
  const trigger = screen.getByRole("button", { name: "Service" });
  expect(trigger).toHaveTextContent("All services");
  expect(trigger).toHaveStyle({ boxShadow: "none", transform: "none" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(screen.queryByRole("listbox", { name: "Service" })).not.toBeInTheDocument();
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("group", { name: "Services" })).toHaveStyle({ boxShadow: "none" });
  const options = within(screen.getByRole("group", { name: "Services" })).getAllByRole("checkbox");
  expect(options).toHaveLength(4);
  for (const option of options) expect(option).toBeChecked();
  fireEvent.click(screen.getByRole("checkbox", { name: "Model Generation" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "User Refinement" }));
  expect(trigger).toHaveTextContent("2 services");
  fireEvent.click(screen.getByRole("checkbox", { name: "IQ Refinement" }));
  const last = screen.getByRole("checkbox", { name: "Index Extraction" });
  expect(last).toBeDisabled();
  expect(last).toBeChecked();
  expect(trigger).toHaveTextContent("Index Extraction");
  fireEvent.click(last);
  expect(last).toBeChecked();
  fireEvent.keyDown(last, { key: "Escape" });
  await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(screen.getByText("No usage in the selected period.")).toBeInTheDocument();
});


it("preserves equal widths and the overlay order when IQ cost exceeds Index Extraction cost", () => {
  showUsage(records.filter(row => row.code === "b" || row.code === "c").map(row => row.name === "iq_refinement" ? { ...row, cost: 44 } : row));
  const bars = [...screen.getByRole("img").querySelectorAll("rect")];
  expect(bars.map(bar => bar.querySelector("title")!.textContent)).toEqual([
    "Total 2026-10-05: $66.0000", "Index Extraction 2026-10-05: $22.0000, 10 pages", "IQ Refinement 2026-10-05: $44.0000, 2 pages",
  ]);
  expect(new Set(bars.map(bar => bar.getAttribute("width"))).size).toBe(1);
  expect(new Set(bars.map(bar => bar.getAttribute("x"))).size).toBe(1);
  expect(Number(bars[1].getAttribute("height"))).toBeLessThan(Number(bars[2].getAttribute("height")));
});

it("shows the approved Totals values from Index Extraction and IQ Refinement", () => {
  showUsage([
    { ...records[0], cost: 3.9563, page_num: 70 },
    { ...records[2], cost: 0.075, page_num: 5 },
  ]);
  const totals = screen.getByRole("region", { name: "Totals usage" });
  expect(within(totals).getByText("Service cost").nextElementSibling).toHaveTextContent("$4.0313");
  expect(within(totals).getByText("Average page cost").nextElementSibling).toHaveTextContent("$0.0715");
});

it.each(["extraction", "iq_refinement"] as const)("sums only available averages when %s has no pages", name => {
  showUsage(records.map(row => row.name === name ? { ...row, page_num: 0 } : row));
  const totals = screen.getByRole("region", { name: "Totals usage" });
  expect(within(totals).getByText("Service cost").nextElementSibling).toHaveTextContent("$38.5000");
  expect(within(totals).getByText("Average page cost").nextElementSibling).toHaveTextContent(name === "extraction" ? "$2.7500" : "$3.0000");
});

it("places every summary row beneath its chart while preserving summary styles", () => {
  showUsage();
  for (const label of ["Index Extraction and IQ Refinement", "User Refinement", "Model Generation"]) {
    const card = screen.getByRole("region", { name: `${label} usage` });
    const chart = within(card).getByRole("img");
    const heading = within(card).getByRole("heading", { name: label === "Index Extraction and IQ Refinement" ? "Totals" : label });
    const summaries = heading.parentElement!.parentElement!;
    expect(card.firstElementChild).toBe(chart.parentElement);
    expect(chart.parentElement!.nextElementSibling).toBe(summaries);
  }
});

it.each([0, 3])("shows only Service cost in the Model Generation summary with %s pages", pages => {
  showUsage(records.map(row => row.name === "model_generation" ? { ...row, page_num: pages } : row));
  const models = screen.getByRole("region", { name: "Model Generation usage" });
  expect(within(models).getByText("Service cost").nextElementSibling).toHaveTextContent("$3.0000");
  expect(models.querySelectorAll("dt")).toHaveLength(1);
  for (const label of ["Sessions", "Pages used", "Average page cost", "No pages used"]) {
    expect(within(models).queryByText(label)).not.toBeInTheDocument();
  }
});

it("ends with Total Service Costs for all services regardless of service selection", () => {
  showUsage();
  const total = screen.getByRole("region", { name: "Total Service Costs" });
  expect(within(total).getByText("Total Service Costs").nextElementSibling).toHaveTextContent("$43.5000");
  expect(total.parentElement!.lastElementChild).toBe(total);
  const heading = within(total).getByRole("heading", { name: "Total Service Costs" });
  const extraction = screen.getByRole("region", { name: "Index Extraction usage" });
  expect(heading).toHaveStyle({ fontSize: "1rem", fontWeight: 600, margin: 0 });
  expect(total).toHaveStyle({ display: "flex", flexWrap: "wrap", alignItems: "baseline" });
  expect(heading.nextElementSibling).toHaveAttribute("style", within(extraction).getByText("Service cost").nextElementSibling!.getAttribute("style")!);
  expect(total.querySelectorAll("dt")).toHaveLength(0);
  for (const name of Object.keys(names) as UsageRecord["name"][]) {
    selectServices([name]);
    expect(within(total).getByText("Total Service Costs").nextElementSibling).toHaveTextContent("$43.5000");
    expect(total.parentElement!.lastElementChild).toBe(total);
  }
  fireEvent.change(screen.getByLabelText("Period"), { target: { value: "weekly" } });
  expect(within(total).getByText("Total Service Costs").nextElementSibling).toHaveTextContent("$43.5000");
});

it("restricts Total Service Costs to the selected UTC dates even when charts are filtered out", () => {
  showUsage([
    ...records,
    { ...records[0], code: "before", cost: 100, timestamp: "2026-08-31T23:59:59Z" },
    { ...records[0], code: "after", cost: 200, timestamp: "2026-11-01T00:00:00Z" },
  ]);
  const total = screen.getByRole("region", { name: "Total Service Costs" });
  expect(within(total).getByText("Total Service Costs").nextElementSibling).toHaveTextContent("$43.5000");
  fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-10-05" } });
  expect(within(total).getByText("Total Service Costs").nextElementSibling).toHaveTextContent("$32.5000");
  selectServices(["model_generation"]);
  fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-10-04" } });
  fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-10-04" } });
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("No usage in the selected period.")).toBeInTheDocument();
  expect(within(total).getByText("Total Service Costs").nextElementSibling).toHaveTextContent("$11.0000");
});

it("shows zero Total Service Costs when the selected dates have no usage", () => {
  showUsage([]);
  expect(screen.getByText("No usage in the selected period.")).toBeInTheDocument();
  const total = screen.getByRole("region", { name: "Total Service Costs" });
  expect(within(total).getByText("Total Service Costs").nextElementSibling).toHaveTextContent("$0.0000");
});
