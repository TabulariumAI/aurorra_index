import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AuditGaps } from "../component/AuditGaps";
import type { AuditGap } from "../type/audit.types";

const gap: AuditGap = {
  solution: "ADD", explanation: "", page: "1", owner: "USER",
  timestamp: "2026-01-03T12:00:00Z", segment: "party",
};
const filters = { changeType: "", process: "", segment: "" };

it("collapses whitespace before deciding whether a message needs expansion", () => {
  render(<AuditGaps filters={filters} report={{ gaps: [{ ...gap, explanation: `  A${" \n ".repeat(100)}short\tmessage  ` }] }} />);
  expect(screen.getByText("A short message")).toBeVisible();
  expect(screen.queryByRole("link", { name: "[Show more]" })).toBeNull();
});

it("preserves the normalized message through expansion and collapse", () => {
  const message = "A detailed audit message. ".repeat(20).trim();
  render(<AuditGaps filters={filters} report={{ gaps: [{ ...gap, explanation: ` \n ${message.replaceAll(" ", "  \n ")} \t ` }] }} />);
  const preview = `${message.slice(0, 200)}...`;
  expect(screen.getByText(preview, { exact: false })).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: "[Show more]" }));
  expect(screen.getByText(message, { exact: false })).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: "[Show less]" }));
  expect(screen.getByText(preview, { exact: false })).toBeVisible();
});
