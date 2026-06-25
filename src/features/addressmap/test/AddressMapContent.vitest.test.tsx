import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appendAddressMapZoom, buildAddressMapEmbedUrl } from "../data/addressMap";
import { AddressMapContent } from "../component/AddressMapContent";

describe("AddressMapContent", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the Google Maps iframe with donor contract defaults after render delay", () => {
    vi.useFakeTimers();
    const source = buildAddressMapEmbedUrl("123 Main St, Austin, TX 78701");

    render(<AddressMapContent source={source} zoom={14} />);

    const iframe = screen.getByTestId("address-map-iframe");

    expect(iframe).toHaveAttribute("loading", "lazy");
    expect(iframe).toHaveAttribute("referrerPolicy", "no-referrer");
    expect(iframe).toHaveAttribute("allowFullScreen");
    expect(iframe).toHaveAttribute("frameBorder", "0");
    expect(iframe).toHaveStyle({ display: "none", width: "100%", height: "100%", background: "transparent" });
    expect(iframe.getAttribute("src")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(iframe).toHaveStyle({ display: "block" });
    expect(iframe).toHaveAttribute("src", appendAddressMapZoom(source, 14));
  });

  it("uses custom zoom when open", () => {
    vi.useFakeTimers();
    const source = buildAddressMapEmbedUrl("456 Oak St, Austin, TX 78701");

    render(<AddressMapContent source={source} zoom={17} />);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByTestId("address-map-iframe")).toHaveAttribute(
      "src",
      appendAddressMapZoom(source, 17),
    );
  });

  it("clears and hides iframe source on reset path", () => {
    vi.useFakeTimers();
    const source = buildAddressMapEmbedUrl("789 Pine St, Austin, TX 78701");

    const { rerender } = render(<AddressMapContent source={source} zoom={14} />);
    const iframe = screen.getByTestId("address-map-iframe");

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(iframe).toHaveStyle({ display: "block" });
    expect(iframe).toHaveAttribute("src", appendAddressMapZoom(source, 14));

    rerender(<AddressMapContent source="" zoom={14} />);

    expect([null, ""]).toContain(iframe.getAttribute("src"));
    expect(iframe).toHaveStyle({ display: "none" });
    expect(iframe.getAttribute("src")).toBeNull();
  });
});
