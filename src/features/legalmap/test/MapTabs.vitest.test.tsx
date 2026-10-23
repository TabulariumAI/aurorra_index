import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { buildAddressMapEmbedUrl, DEFAULT_ADDRESS_MAP_ZOOM } from "../../addressmap/data/addressMap";
import { AddressMapContent } from "../../addressmap/component/AddressMapContent";

const legal = { summary: "One parcel.", groups: [
  { type: "lot_block", elements: [{ aspect: "lot", value: "8" }, { aspect: "block", value: "2" }] },
  { type: "plat_reference", elements: [{ aspect: "plat_volume", value: "6" }] },
] };
const onMapReady = vi.fn();
const onLoaderChange = vi.fn();
const addressMap = {
  address: "123 Main St, Austin, TX 78701",
  content: <AddressMapContent
    source={buildAddressMapEmbedUrl("123 Main St, Austin, TX 78701")}
    zoom={DEFAULT_ADDRESS_MAP_ZOOM}
    onLoaderChange={onLoaderChange}
    onReadyChange={onMapReady}
  />,
};

describe("combined property map", () => {
  afterEach(() => vi.useRealTimers());

  it("uses the shared flat control styling for both map views", () => {
    render(<LegalMapContent legal={legal} addressMap={addressMap} />);
    for (const tab of within(screen.getByRole("tablist", { name: "Map views" })).getAllByRole("tab")) {
      expect(tab).toHaveStyle({ boxShadow: "none", transform: "none", height: "2rem" });
    }
    expect(screen.getByRole("tablist", { name: "Map views" }).parentElement).toHaveStyle({ display: "grid", padding: "0.75rem" });
    expect(document.querySelector(".legal-map-column")).toHaveStyle({ position: "relative" });
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    for (const tab of within(screen.getByRole("tablist", { name: "Map views" })).getAllByRole("tab")) {
      expect(tab).toHaveStyle({ boxShadow: "none", transform: "none" });
    }
  });

  it("opens Plat first, retains summary without references or an address card, and switches only the map", () => {
    const onReadyChange = vi.fn();
    render(<LegalMapContent legal={legal} addressMap={addressMap} onReadyChange={onReadyChange} />);
    const plat = screen.getByRole("tab", { name: "Lot & block" });
    expect(plat).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("8Lot");
    const info = document.querySelector(".legal-map-summary") as HTMLElement;
    expect(within(info).queryAllByRole("heading")).toEqual([]);
    expect(info).toHaveTextContent(legal.summary);
    expect(within(info).queryByText(addressMap.address)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    expect(screen.getByRole("tab", { name: "Address" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Address");
    expect(document.querySelector("[data-legal-map-surface]")).toContainElement(screen.getByTitle("Address map"));
    expect(screen.getByTitle("Address map")).toHaveAttribute("src", `${buildAddressMapEmbedUrl(addressMap.address)}&z=${DEFAULT_ADDRESS_MAP_ZOOM}`);
    expect(onMapReady).toHaveBeenLastCalledWith(false);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    fireEvent.load(screen.getByTitle("Address map"));
    expect(onMapReady).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole("table", { name: "Reference" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Lot & block" }));
    expect(screen.queryByTitle("Address map")).not.toBeInTheDocument();
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("8Lot");
    expect(onLoaderChange).toHaveBeenLastCalledWith(null);
  });

  it("supports arrow, Home and End keyboard navigation", () => {
    render(<LegalMapContent legal={legal} addressMap={addressMap} onReadyChange={vi.fn()} />);
    screen.getByRole("tab", { name: "Lot & block" }).focus();
    for (const [key, target] of [["ArrowRight", "Address"], ["Home", "Lot & block"], ["End", "Address"], ["ArrowLeft", "Lot & block"]]) {
      fireEvent.keyDown(document.activeElement!, { key });
      expect(screen.getByRole("tab", { name: target })).toHaveFocus();
      expect(screen.getByRole("tab", { name: target })).toHaveAttribute("aria-selected", "true");
    }
  });

  it("hides unavailable tabs and selects Address for address-only data", () => {
    render(<LegalMapContent legal={null} addressMap={addressMap} onReadyChange={vi.fn()} />);
    expect(screen.queryByRole("tab", { name: "Lot & block" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Address" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTitle("Address map")).toBeInTheDocument();
  });

  it("hides Address and its section when no property address exists", () => {
    render(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(screen.queryByRole("tab", { name: "Address" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Address" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Lot & block" })).toHaveAttribute("aria-selected", "true");
  });

  it("does not enable Plat for reference-only or empty lot/block values", () => {
    const { rerender } = render(<LegalMapContent legal={{ groups: [legal.groups[1]] }} addressMap={addressMap} onReadyChange={vi.fn()} />);
    expect(screen.queryByRole("tab", { name: "Lot & block" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Reference" })).not.toBeInTheDocument();
    rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: " " }] }] }} onReadyChange={vi.fn()} />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Address map")).not.toBeInTheDocument();
  });

  it("updates address and selected availability when cached data changes", () => {
    const { rerender } = render(<LegalMapContent legal={legal} addressMap={addressMap} onReadyChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    const next = { address: "456 Oak St, Austin, TX 78701", content: <AddressMapContent
      source={buildAddressMapEmbedUrl("456 Oak St, Austin, TX 78701")}
      zoom={DEFAULT_ADDRESS_MAP_ZOOM}
      onLoaderChange={onLoaderChange}
      onReadyChange={onMapReady}
    /> };
    rerender(<LegalMapContent legal={legal} addressMap={next} onReadyChange={vi.fn()} />);
    expect(screen.queryByText(addressMap.address)).not.toBeInTheDocument();
    expect(screen.queryByText(next.address)).not.toBeInTheDocument();
    expect(screen.getByTitle("Address map").getAttribute("src")).toContain("456%20Oak");
    rerender(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "Lot & block" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTitle("Address map")).not.toBeInTheDocument();
  });

  it("retains the existing Google Maps timeout link", () => {
    vi.useFakeTimers();
    render(<LegalMapContent legal={null} addressMap={addressMap} onReadyChange={vi.fn()} />);
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("status")).toHaveTextContent("The map is taking longer than expected.");
    expect(screen.getByRole("link", { name: "Open Google Maps" })).toHaveAttribute("target", "_blank");
  });
});


it("shares the map surface and header styles across all four views", () => {
  const boundary = { type: "metes_bounds", elements: [{ aspect: "bearings", value: "N; E; S; W" }, { aspect: "distances", value: "100; 50; 100; 50" }] };
  const plss = { type: "plss", elements: [{ aspect: "aliquots", value: "NW1/4 of Section 10" }] };
  render(<LegalMapContent legal={{ ...legal, groups: [...legal.groups, boundary, plss] }} addressMap={addressMap} />);
  let reference: string[] | undefined;
  for (const name of ["Metes & Bounds", "Lot & block", "PLSS", "Address"]) {
    fireEvent.click(screen.getByRole("tab", { name }));
    const surface = document.querySelector<HTMLElement>("[data-legal-map-surface]")!;
    expect(surface).not.toBeNull();
    const appearance = [surface.style.backgroundImage, surface.style.backgroundColor, surface.style.border, surface.style.borderRadius, surface.style.backgroundSize, surface.style.overflow];
    if (!reference) reference = appearance;
    expect(appearance).toEqual(reference);
    expect(surface.querySelector(".legal-map-header")).toContainElement(screen.getByRole("tablist", { name: "Map views" }));
    if (name === "Address") {
      expect(surface).toContainElement(screen.getByTitle("Address map"));
      expect(surface.querySelector("[data-legal-map-north]")).toBeNull();
      expect(surface.querySelector(".legal-map-legend")).toBeNull();
    } else {
      expect(surface.querySelector(".legal-map-legend")).toHaveStyle({ fontSize: "0.875rem", fontWeight: 400, flexDirection: "column", gap: "0.35rem", padding: "0.6rem 0.75rem", marginLeft: "auto" });
      expect(surface.querySelector("[data-legal-map-north]")).not.toBeNull();
    }
  }
});
