import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { IndexDetails } from "../IndexDetails";

const fields = { index: "Index value", label: "Borrower", page: "3", source: "Recorded source" };

it("separates the index label from the source and page quote group", () => {
  render(<IndexDetails fields={fields} onChange={vi.fn()} />);
  const trigger = screen.getByRole("button", { name: "Additional details" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("group", { name: "Quote" })).toBeNull();
  fireEvent.click(trigger);
  const quote = screen.getByRole("group", { name: "Quote" });
  expect(within(quote).getByRole("textbox", { name: "Source" })).toHaveValue(fields.source);
  expect(within(quote).getByRole("textbox", { name: "Page Number" })).toHaveValue(fields.page);
  expect(within(quote).queryByRole("textbox", { name: "Label" })).toBeNull();
  expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(fields.label);
});

it.each([["Label", "label"], ["Source", "source"], ["Page Number", "page"]] as const)("changes %s without changing the other index fields", (name, key) => {
  const onChange = vi.fn();
  render(<IndexDetails fields={fields} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Additional details" }));
  fireEvent.change(screen.getByRole("textbox", { name }), { target: { value: "Updated" } });
  expect(onChange).toHaveBeenCalledExactlyOnceWith({ ...fields, [key]: "Updated" });
});

it("retains the parent-owned field values across collapse and reopen", () => {
  const onChange = vi.fn();
  const view = render(<IndexDetails fields={fields} onChange={onChange} />);
  const trigger = screen.getByRole("button", { name: "Additional details" });
  fireEvent.click(trigger);
  view.rerender(<IndexDetails fields={{ ...fields, source: "Updated source", page: "7" }} onChange={onChange} />);
  fireEvent.click(trigger);
  expect(screen.queryByRole("textbox", { name: "Source" })).toBeNull();
  fireEvent.click(trigger);
  expect(screen.getByRole("textbox", { name: "Source" })).toHaveValue("Updated source");
  expect(screen.getByRole("textbox", { name: "Page Number" })).toHaveValue("7");
  expect(onChange).not.toHaveBeenCalled();
});
