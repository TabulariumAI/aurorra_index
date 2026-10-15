import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appendAddressMapZoom, buildAddressMapEmbedUrl } from "../data/addressMap";
import { AddressMapContent } from "../component/AddressMapContent";

const source = buildAddressMapEmbedUrl("123 Main St, Austin, TX 78701");
const nextSource = buildAddressMapEmbedUrl("456 Oak St, Austin, TX 78701");

describe("AddressMapContent", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("starts eager navigation and remains not ready until the iframe loads", () => {
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    render(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={source} zoom={14} />);
    const iframe = screen.getByTestId("address-map-iframe");
    expect(iframe).toHaveAttribute("src", appendAddressMapZoom(source, 14));
    expect(iframe).toHaveAttribute("loading", "eager");
    expect(iframe).toHaveAttribute("title", "Address map");
    expect(iframe).toHaveAttribute("referrerPolicy", "no-referrer");
    expect(iframe).toHaveAttribute("allowFullScreen");
    expect(iframe).toHaveAttribute("frameBorder", "0");
    expect(iframe).toHaveStyle({ visibility: "hidden", width: "100%", height: "100%", background: "transparent" });
    act(() => vi.advanceTimersByTime(650));
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    expect(onReadyChange).not.toHaveBeenCalledWith(true);
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Loading map…"]);
    fireEvent.load(iframe);
    expect(iframe).toHaveStyle({ visibility: "visible" });
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    expect(onLoaderChange).toHaveBeenLastCalledWith(null);
  });

  it("preserves custom zoom and cancels the timeout after a fast load", () => {
    render(<AddressMapContent onLoaderChange={vi.fn()} onReadyChange={vi.fn()} source={source} zoom={17} />);
    const iframe = screen.getByTestId("address-map-iframe");
    expect(iframe).toHaveAttribute("src", appendAddressMapZoom(source, 17));
    fireEvent.load(iframe);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(iframe).toHaveStyle({ visibility: "visible" });
  });

  it("shows slow-load feedback at ten seconds with a direct Google Maps link", () => {
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    render(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={source} zoom={14} />);
    act(() => vi.advanceTimersByTime(9_999));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toHaveTextContent("The map is taking longer than expected.");
    const link = screen.getByRole("link", { name: "Open Google Maps" });
    const url = new URL(link.getAttribute("href")!);
    expect(url.origin).toBe("https://www.google.com");
    expect(url.pathname).toBe("/maps");
    expect(url.searchParams.get("q")).toBe("123 Main St, Austin, TX 78701");
    expect(url.searchParams.has("output")).toBe(false);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    expect(onLoaderChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByTestId("address-map-iframe")).toHaveStyle({ visibility: "hidden" });
  });

  it("replaces timeout feedback with the same iframe when it loads late", () => {
    render(<AddressMapContent onLoaderChange={vi.fn()} onReadyChange={vi.fn()} source={source} zoom={14} />);
    const iframe = screen.getByTestId("address-map-iframe");
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.load(iframe);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTestId("address-map-iframe")).toBe(iframe);
    expect(iframe).toHaveStyle({ visibility: "visible" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("restarts the timeout for a new address and ignores the old iframe", () => {
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    const { rerender } = render(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={source} zoom={14} />);
    const oldIframe = screen.getByTestId("address-map-iframe");
    act(() => vi.advanceTimersByTime(9_000));
    rerender(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={nextSource} zoom={14} />);
    const iframe = screen.getByTestId("address-map-iframe");
    expect(iframe).not.toBe(oldIframe);
    expect(iframe).toHaveAttribute("src", appendAddressMapZoom(nextSource, 14));
    fireEvent.load(oldIframe);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    act(() => vi.advanceTimersByTime(9_999));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(new URL(screen.getByRole("link").getAttribute("href")!).searchParams.get("q")).toBe("456 Oak St, Austin, TX 78701");
  });

  it("clears timeout feedback when the address changes", () => {
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    const { rerender } = render(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={source} zoom={14} />);
    act(() => vi.advanceTimersByTime(10_000));
    const oldIframe = screen.getByTestId("address-map-iframe");
    rerender(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={nextSource} zoom={14} />);
    fireEvent.load(oldIframe);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Loading map…"]);
    fireEvent.load(screen.getByTestId("address-map-iframe"));
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("resets a loaded map when zoom changes", () => {
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    const { rerender } = render(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={source} zoom={14} />);
    const oldIframe = screen.getByTestId("address-map-iframe");
    fireEvent.load(oldIframe);
    rerender(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={source} zoom={17} />);
    const iframe = screen.getByTestId("address-map-iframe");
    expect(iframe).not.toBe(oldIframe);
    expect(iframe).toHaveAttribute("src", appendAddressMapZoom(source, 17));
    expect(iframe).toHaveStyle({ visibility: "hidden" });
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    fireEvent.load(iframe);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("clears timeout feedback and navigation when source is reset", () => {
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    const { rerender } = render(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source={source} zoom={14} />);
    act(() => vi.advanceTimersByTime(10_000));
    rerender(<AddressMapContent onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} source="" zoom={14} />);
    expect(screen.queryByTestId("address-map-iframe")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    expect(onLoaderChange).toHaveBeenLastCalledWith(null);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not restart a loaded map when callback identities change", () => {
    const { rerender } = render(<AddressMapContent onLoaderChange={vi.fn()} onReadyChange={vi.fn()} source={source} zoom={14} />);
    const iframe = screen.getByTestId("address-map-iframe");
    fireEvent.load(iframe);
    const onReadyChange = vi.fn();
    rerender(<AddressMapContent onLoaderChange={vi.fn()} onReadyChange={onReadyChange} source={source} zoom={14} />);
    expect(screen.getByTestId("address-map-iframe")).toBe(iframe);
    expect(iframe).toHaveStyle({ visibility: "visible" });
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans up timers on unmount, including Strict Mode effect replay", () => {
    const onReadyChange = vi.fn();
    const { unmount } = render(<StrictMode><AddressMapContent onLoaderChange={vi.fn()} onReadyChange={onReadyChange} source={source} zoom={14} /></StrictMode>);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    onReadyChange.mockClear();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onReadyChange).not.toHaveBeenCalled();
  });
});
