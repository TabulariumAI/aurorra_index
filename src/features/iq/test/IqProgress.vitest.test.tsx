import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IqProgress } from "../component/IqProgress";

describe("IQ decorative progress", () => {
  let scrollDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    scrollDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    if (scrollDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollDescriptor);
    else delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("advances through exactly the three approved messages at the supplied interval", () => {
    render(<IqProgress intervalMs={7500} />);
    const timeline = screen.getByRole("list", { name: "GENERATING IQ REPORT updates" });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(1);
    expect(within(timeline).getByText("Checking segment quality…")).toBeVisible();
    act(() => vi.advanceTimersByTime(7499));
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(within(timeline).getAllByRole("listitem").map(row => row.dataset.phase)).toEqual(["completed", "started"]);
    expect(within(timeline).getByText("Checking compliance gates…")).toBeVisible();
    act(() => vi.advanceTimersByTime(7500));
    const rows = within(timeline).getAllByRole("listitem");
    expect(rows.map(row => row.textContent)).toEqual([
      "Checking segment quality…", "Checking compliance gates…", "Generating IQ report…",
    ]);
    expect(rows.map(row => row.dataset.phase)).toEqual(["completed", "completed", "started"]);
    expect(within(rows[2]).getByLabelText("In progress")).toHaveAttribute("aria-current", "step");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(75000));
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(3);
    expect(rows[2]).toHaveAttribute("data-phase", "started");
  });

  it.each([0, 1])("cancels its timer when removed during step %s", step => {
    const { unmount } = render(<IqProgress intervalMs={7500} />);
    act(() => vi.advanceTimersByTime(step * 7500));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts the first step again when regeneration is reopened", () => {
    const { unmount } = render(<IqProgress intervalMs={7500} />);
    act(() => vi.advanceTimersByTime(7500));
    act(() => vi.advanceTimersByTime(7500));
    expect(screen.getByText("Generating IQ report…")).toBeVisible();
    unmount();
    render(<IqProgress intervalMs={7500} />);
    expect(screen.getByText("Checking segment quality…")).toBeVisible();
    expect(screen.queryByText("Checking compliance gates…")).not.toBeInTheDocument();
    expect(screen.queryByText("Generating IQ report…")).not.toBeInTheDocument();
  });
});
