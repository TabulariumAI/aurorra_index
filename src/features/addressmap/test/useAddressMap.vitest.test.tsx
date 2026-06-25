import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_ADDRESS_MAP_ZOOM, buildAddressMapEmbedUrl } from "../data/addressMap";
import { useAddressMap } from "../hook/useAddressMap";
import type { JSX } from "react";

function HookHarness(): JSX.Element {
  const {
    addressMapOpen,
    addressMapSource,
    addressMapZoom,
    closeAddressMap,
    openAddressMap,
  } = useAddressMap();

  return (
    <div>
      <button onClick={() => openAddressMap("123 Main St, Austin, TX 78701")}>Open default</button>
      <button onClick={() => openAddressMap("456 Oak St, Austin, TX 78701", 17)}>Open custom zoom</button>
      <button onClick={closeAddressMap}>Close</button>
      <div data-testid="open">{addressMapOpen ? "open" : "closed"}</div>
      <div data-testid="zoom">{addressMapZoom}</div>
      <div data-testid="source">{addressMapSource}</div>
    </div>
  );
}

describe("useAddressMap", () => {
  it("opens a built embed URL and default zoom", () => {
    render(<HookHarness />);

    fireEvent.click(screen.getByText("Open default"));

    expect(screen.getByTestId("open").textContent).toBe("open");
    expect(screen.getByTestId("zoom").textContent).toBe(String(DEFAULT_ADDRESS_MAP_ZOOM));
    expect(screen.getByTestId("source").textContent).toBe(buildAddressMapEmbedUrl("123 Main St, Austin, TX 78701"));
  });

  it("opens a custom zoom and closes with source reset", () => {
    render(<HookHarness />);

    fireEvent.click(screen.getByText("Open custom zoom"));
    expect(screen.getByTestId("zoom").textContent).toBe("17");
    expect(screen.getByTestId("source").textContent).toBe(
      buildAddressMapEmbedUrl("456 Oak St, Austin, TX 78701"),
    );

    fireEvent.click(screen.getByText("Close"));

    expect(screen.getByTestId("open").textContent).toBe("closed");
    expect(screen.getByTestId("source").textContent).toBe("");
    expect(screen.getByTestId("zoom").textContent).toBe(String(DEFAULT_ADDRESS_MAP_ZOOM));
  });
});
