import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { iconButtonStyle } from "aurora-core";
import { IqNote } from "../component/IqNote";
import { prepareIqReport } from "../data/iqData";

afterEach(cleanup);

it("preserves segment ownership and prepares the existing segment display convention", () => {
  const notes = [
    { segment: "sides", message: "Party assessment." },
    { segment: "transaction", message: "Required indexes were not confirmed: Loan Amount or Promissory Note Amount." },
    { segment: "party", message: "WARNING: The party segment has ambiguous index values for person." },
    { segment: null, message: "Unclassified indexes: Satisfied (0/18)" },
  ];
  const original = structuredClone(notes);
  expect(prepareIqReport({ notes }).notes).toEqual({ data: [
    { ...notes[0], segment: "Sides", status: "neutral" },
    { ...notes[1], segment: "Transaction", status: "neutral" },
    { ...notes[2], segment: "Party", status: "warning" },
    { ...notes[3], status: "success" },
  ], error: null });
  expect(notes).toEqual(original);
});

it("renders the optional segment in bold before the message", () => {
  const { container } = render(<IqNote note={{ segment: "Legal", message: "One parcel is described.", status: "neutral" }} />);
  const heading = screen.getByText("Legal");
  expect(heading.tagName).toBe("STRONG");
  expect(heading.nextElementSibling).toHaveTextContent("One parcel is described.");
  expect(heading.parentElement).toHaveStyle({ display: "grid" });
  expect(container.querySelectorAll("strong")).toHaveLength(1);
});

it("omits an absent segment without a placeholder heading", () => {
  const { container } = render(<IqNote note={{ segment: null, message: "Report note", status: "neutral" }} />);
  expect(container.querySelector("strong")).toBeNull();
  expect(screen.getByText("Report note")).toBeVisible();
});

it("uses an uppercase dark warning label only for an ambiguous-index warning", () => {
  render(<IqNote note={{ segment: "Party", message: "WARNING: The party segment has ambiguous index values for person.", status: "warning" }} />);
  expect(screen.getByText("WARNING:", { exact: true })).toHaveStyle({ color: "#92400e", fontWeight: 700 });
  expect(screen.getByText("The party segment has ambiguous index values for person.", { exact: true })).toBeVisible();
  expect(screen.getByText("Party")).toBeVisible();
});

it("renders unconfirmed indexes as information with no warning label", () => {
  render(<IqNote note={{ segment: "Transaction", message: "Required indexes were not confirmed: Loan Amount or Promissory Note Amount.", status: "neutral" }} />);
  expect(screen.queryByText(/WARNING:/)).toBeNull();
  expect(screen.getByText("Required indexes were not confirmed: Loan Amount or Promissory Note Amount.")).toBeVisible();
});

it.each([null, "Execution"])("keeps the segment visible through expansion and collapse: %s", segment => {
  const words = Array.from({ length: 35 }, (_, index) => `word${index + 1}`);
  render(<IqNote note={{ segment, message: words.join(" "), status: "neutral" }} />);
  const preview = screen.getByText(`${words.slice(0, 25).join(" ")}…`);
  expect(preview).toBeVisible();
  expect(screen.getByRole("button", { name: "Expand note" })).toHaveStyle({
    background: iconButtonStyle.background,
    color: iconButtonStyle.color,
    height: iconButtonStyle.height,
    width: iconButtonStyle.width,
  });
  if (segment) expect(screen.getByText(segment)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Expand note" }));
  expect(screen.getByText(words.join(" "))).toBeVisible();
  if (segment) expect(screen.getByText(segment)).toBeVisible();
  expect(screen.getByRole("button", { name: "Collapse note" })).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("button", { name: "Collapse note" }));
  expect(screen.getByText(`${words.slice(0, 25).join(" ")}…`)).toBeVisible();
  if (segment) expect(screen.getByText(segment)).toBeVisible();
});
