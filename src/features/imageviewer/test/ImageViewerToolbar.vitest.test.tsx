import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageViewerFooterToolbar, ImageViewerTopToolbar } from "../component/ImageViewerToolbar";

describe("ImageViewerToolbar", () => {
  it("renders top search and view controls", () => {
    const onAction = vi.fn();
    render(
      <ImageViewerTopToolbar
        canActualSize
        canClearSearch
        canFitHeight
        canFitPage
        canFitWidth
        canSearch
        canZoomIn
        canZoomOut
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={<button type="button">Close preview</button>}
        searchText=""
      />,
    );

    expect(screen.getByLabelText("Image viewer top toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("Image view controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close preview" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search image text" })).toHaveAttribute("placeholder", "Search image text");
    expect(
      screen.getByLabelText("Image view controls").compareDocumentPosition(screen.getByLabelText("Image text search")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit width" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit height" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit page" }));
    fireEvent.click(screen.getByRole("button", { name: "Actual size" }));

    expect(onAction).toHaveBeenCalledWith("search");
    expect(onAction).toHaveBeenCalledWith("clearSearch");
    expect(onAction).toHaveBeenCalledWith("zoomOut");
    expect(onAction).toHaveBeenCalledWith("zoomIn");
    expect(onAction).toHaveBeenCalledWith("fitWidth");
    expect(onAction).toHaveBeenCalledWith("fitHeight");
    expect(onAction).toHaveBeenCalledWith("fitPage");
    expect(onAction).toHaveBeenCalledWith("actualSize");
    expect(screen.queryByRole("button", { name: "Find selected index" })).not.toBeInTheDocument();
    expect(screen.queryByText(/add|remove|reorder|export|draw/i)).not.toBeInTheDocument();
  });

  it("renders footer page controls", () => {
    const onAction = vi.fn();
    render(
      <ImageViewerFooterToolbar
        canGoFirst
        canGoLast
        canGoNext
        canGoPrevious
        canShowThumbnails
        onAction={onAction}
        page={2}
        pageCount={4}
      />,
    );

    expect(screen.getByLabelText("Image viewer footer toolbar")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Thumbnails" }));
    fireEvent.click(screen.getByRole("button", { name: "First page" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    fireEvent.click(screen.getByRole("button", { name: "Last page" }));

    expect(onAction).toHaveBeenCalledWith("thumbs");
    expect(onAction).toHaveBeenCalledWith("first");
    expect(onAction).toHaveBeenCalledWith("previous");
    expect(onAction).toHaveBeenCalledWith("next");
    expect(onAction).toHaveBeenCalledWith("last");
    expect(screen.queryByText(/add|remove|reorder|export|draw/i)).not.toBeInTheDocument();
  });
});
