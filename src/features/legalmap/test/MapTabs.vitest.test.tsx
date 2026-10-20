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
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveStyle({ boxShadow: "none", transform: "none", height: "2rem" });
    }
    expect(screen.getByRole("tablist")).toHaveStyle({ position: "absolute" });
    expect(document.querySelector(".legal-map-column")).toHaveStyle({ position: "relative" });
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab).toHaveStyle({ boxShadow: "none", transform: "none" });
    }
  });

  it("opens Plat first, shows address between summary and reference, and switches only the map", () => {
    const onReadyChange = vi.fn();
    render(<LegalMapContent legal={legal} addressMap={addressMap} onReadyChange={onReadyChange} />);
    const plat = screen.getByRole("tab", { name: "Plat" });
    expect(plat).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("8Lot");
    const info = document.querySelector("[data-legal-map-info]") as HTMLElement;
    expect(within(info).getAllByRole("heading").map(node => node.textContent)).toEqual(["Summary", "Address", "Reference"]);
    expect(within(info).getByText(addressMap.address)).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    expect(screen.getByRole("tab", { name: "Address" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Address");
    expect(document.querySelector("[data-legal-map-surface]")).not.toBeInTheDocument();
    expect(screen.getByTitle("Address map")).toHaveAttribute("src", `${buildAddressMapEmbedUrl(addressMap.address)}&z=${DEFAULT_ADDRESS_MAP_ZOOM}`);
    expect(onMapReady).toHaveBeenLastCalledWith(false);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    fireEvent.load(screen.getByTitle("Address map"));
    expect(onMapReady).toHaveBeenLastCalledWith(true);
    expect(within(info).getByRole("table", { name: "Reference" })).toBeVisible();
    fireEvent.click(plat);
    expect(screen.queryByTitle("Address map")).not.toBeInTheDocument();
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("8Lot");
    expect(onLoaderChange).toHaveBeenLastCalledWith(null);
  });

  it("supports arrow, Home and End keyboard navigation", () => {
    render(<LegalMapContent legal={legal} addressMap={addressMap} onReadyChange={vi.fn()} />);
    const plat = screen.getByRole("tab", { name: "Plat" });
    const address = screen.getByRole("tab", { name: "Address" });
    plat.focus();
    fireEvent.keyDown(plat, { key: "ArrowRight" });
    expect(address).toHaveFocus();
    expect(address).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(address, { key: "Home" });
    expect(plat).toHaveFocus();
    fireEvent.keyDown(plat, { key: "End" });
    expect(address).toHaveFocus();
    fireEvent.keyDown(address, { key: "ArrowLeft" });
    expect(plat).toHaveFocus();
  });

  it("hides unavailable tabs and selects Address for address-only data", () => {
    render(<LegalMapContent legal={null} addressMap={addressMap} onReadyChange={vi.fn()} />);
    expect(screen.queryByRole("tab", { name: "Plat" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Address" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTitle("Address map")).toBeInTheDocument();
  });

  it("hides Address and its section when no property address exists", () => {
    render(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(screen.queryByRole("tab", { name: "Address" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Address" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Plat" })).toHaveAttribute("aria-selected", "true");
  });

  it("does not enable Plat for reference-only or empty lot/block values", () => {
    const { rerender } = render(<LegalMapContent legal={{ groups: [legal.groups[1]] }} addressMap={addressMap} onReadyChange={vi.fn()} />);
    expect(screen.queryByRole("tab", { name: "Plat" })).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Reference" })).toBeVisible();
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
    expect(screen.getByText(next.address)).toBeVisible();
    expect(screen.getByTitle("Address map").getAttribute("src")).toContain("456%20Oak");
    rerender(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(screen.getByRole("tab", { name: "Plat" })).toHaveAttribute("aria-selected", "true");
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
