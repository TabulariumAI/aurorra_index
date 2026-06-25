import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react-dom/test-utils";
import { DEFAULT_ADDRESS_MAP_ZOOM, buildAddressMapEmbedUrl } from "../data/addressMap";
import { AddressMapDialog } from "../component/AddressMapDialog";

describe("AddressMapDialog", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the shell with donor dialog behavior, built-in close, and close-on-overlay", () => {
    vi.useFakeTimers();
    const source = buildAddressMapEmbedUrl("123 Main St, Austin, TX 78701");
    const onOpenChange = vi.fn();

    render(
      <AddressMapDialog
        onOpenChange={onOpenChange}
        open={true}
        source={source}
        zoom={DEFAULT_ADDRESS_MAP_ZOOM}
      />,
    );

    const dialog = screen.getByRole("dialog");
    const body = document.querySelector("[data-dialog-body='true']");
    const overlay = document.querySelector("[data-dialog-overlay='true']");

    expect(dialog).toHaveAttribute("data-height-mode", "medium");
    expect(body).toHaveAttribute("data-body-mode", "center");
    expect(document.querySelector("[data-dialog-header='true']")).toBeInTheDocument();
    expect(screen.getByText("Address Map")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(1);
    expect(document.querySelector("[data-dialog-footer='true']")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" }).parentElement).toBe(
      document.querySelector("[data-dialog-footer='true']"),
    );
    expect(overlay).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.getByTestId("address-map-iframe")).toHaveAttribute(
      "src",
      `${source}&z=${DEFAULT_ADDRESS_MAP_ZOOM}`,
    );

    fireEvent.click(overlay as Element);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
