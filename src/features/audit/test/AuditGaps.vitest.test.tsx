import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AuditGaps } from "../component/AuditGaps";
import type { AuditGapView } from "../type/audit.types";

const gap: AuditGapView = {
  aspect: "ADD", aspectLabel: "Addition", changeType: "ADD", changeTypeLabel: "Addition",
  date: "2026-01-03T12:00:00Z", dateLabel: "Jan 3, 2026", message: "",
  page: "1", process: "USER", processLabel: "User change", segment: "party",
};

it("collapses whitespace before deciding whether a message needs expansion", () => {
  render(<AuditGaps gaps={[{ ...gap, message: `  A${" \n ".repeat(100)}short\tmessage  ` }]} />);
  expect(screen.getByText("A short message")).toBeVisible();
  expect(screen.queryByRole("link", { name: "[Show more]" })).toBeNull();
});

it("preserves the normalized message through expansion and collapse", () => {
  const message = "A detailed audit message. ".repeat(20).trim();
  render(<AuditGaps gaps={[{ ...gap, message: ` \n ${message.replaceAll(" ", "  \n ")} \t ` }]} />);
  const preview = `${message.slice(0, 200)}...`;
  expect(screen.getByText(preview, { exact: false })).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: "[Show more]" }));
  expect(screen.getByText(message, { exact: false })).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: "[Show less]" }));
  expect(screen.getByText(preview, { exact: false })).toBeVisible();
});
