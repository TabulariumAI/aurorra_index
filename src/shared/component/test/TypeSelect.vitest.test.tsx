import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TypeSelect } from "../TypeSelect";

afterEach(cleanup);

const aspects = { party: ["grantor", "grantee"] };

it("allows the host focus ring after Escape without reopening suggestions", () => {
  const onChange = vi.fn();
  render(<TypeSelect aspects={aspects} segment="party" selected={[]} onChange={onChange} />);
  const input = screen.getByRole("combobox", { name: "Type (required)" });
  expect(input).toBeRequired();
  expect(input).not.toHaveAttribute("required");
  act(() => input.focus());
  expect(screen.getByRole("listbox")).toBeVisible();
  fireEvent.keyDown(input, { key: "Escape" });
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute("aria-expanded", "false");
  expect(input).not.toHaveAttribute("aria-activedescendant");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(input.style.outline).toBe("");
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(screen.getByRole("listbox")).toBeVisible();
  expect(input).toHaveFocus();
});

it("preserves keyboard selection and chip removal", () => {
  const onChange = vi.fn();
  const view = render(<TypeSelect aspects={aspects} segment="party" selected={[]} onChange={onChange} />);
  const input = screen.getByRole("combobox", { name: "Type (required)" });
  expect(input).toBeRequired();
  expect(input).not.toHaveAttribute("required");
  act(() => input.focus());
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  const key = JSON.stringify(["party", "grantor"]);
  expect(onChange).toHaveBeenLastCalledWith([key]);
  view.rerender(<TypeSelect aspects={aspects} segment="party" selected={[key]} onChange={onChange} />);
  expect(screen.getByRole("button", { name: "Remove Grantor (Party)" })).toBeVisible();
  expect(screen.queryByRole("option", { name: "Grantor" })).toBeNull();
  fireEvent.keyDown(input, { key: "Backspace" });
  expect(onChange).toHaveBeenLastCalledWith([]);
  expect(input).toHaveFocus();
});
