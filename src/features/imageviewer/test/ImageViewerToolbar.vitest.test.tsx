import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageViewerFooterToolbar, ImageViewerTopToolbar } from "../component/ImageViewerToolbar";

describe("ImageViewerToolbar", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders top search and view controls", () => {
    const onAction = vi.fn();
    render(
      <ImageViewerTopToolbar
        canActualSize
        canClearSearch
        canExport
        canFitHeight
        canFitPage
        canFitWidth
        canSearch
        canSelect
        canZoomIn
        canZoomOut
        selecting={false}
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={<button type="button">Close preview</button>}
        searchText="Cedar"
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
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit width" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit height" }));
    fireEvent.click(screen.getByRole("button", { name: "Fit page" }));
    fireEvent.click(screen.getByRole("button", { name: "Actual size" }));

    expect(onAction).toHaveBeenCalledWith("search");
    expect(onAction).toHaveBeenCalledWith("clearSearch");
    expect(onAction).toHaveBeenCalledWith("select");
    expect(onAction).toHaveBeenCalledWith("export");
    expect(onAction).toHaveBeenCalledWith("zoomOut");
    expect(onAction).toHaveBeenCalledWith("zoomIn");
    expect(onAction).toHaveBeenCalledWith("fitWidth");
    expect(onAction).toHaveBeenCalledWith("fitHeight");
    expect(onAction).toHaveBeenCalledWith("fitPage");
    expect(onAction).toHaveBeenCalledWith("actualSize");
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "search", source: "click" });
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "clearSearch" });
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "select" });
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "export" });
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "zoomIn" });
    expect(screen.queryByRole("button", { name: "Find selected index" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Selection controls")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy selected words" })).not.toBeInTheDocument();
  });

  it("keeps search input enabled when search action is disabled by lens state", () => {
    const onAction = vi.fn();
    const onSearchText = vi.fn();
    render(
      <ImageViewerTopToolbar
        canActualSize
        canClearSearch
        canExport={false}
        canFitHeight
        canFitPage
        canFitWidth
        canSearch={false}
        canSelect
        canZoomIn
        canZoomOut
        selecting={false}
        onAction={onAction}
        onSearchText={onSearchText}
        previewAction={null}
        searchText="Cedar"
      />,
    );

    const searchBox = screen.getByRole("searchbox", { name: "Search image text" });
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchBox).toBeEnabled();
    expect(searchButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();

    fireEvent.change(searchBox, { target: { value: "Cedar Street" } });

    expect(onSearchText).toHaveBeenCalledWith("Cedar Street");
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar search text", { length: 12 });
    expect(onAction).not.toHaveBeenCalled();
  });

  it("renders select mode as active and exposes the exit action", () => {
    const onAction = vi.fn();
    render(
      <ImageViewerTopToolbar
        canActualSize
        canClearSearch
        canExport
        canFitHeight
        canFitPage
        canFitWidth
        canSearch
        canSelect
        canZoomIn
        canZoomOut
        selecting
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText=""
      />,
    );

    const exitSelect = screen.getByRole("button", { name: "Exit select mode" });
    expect(exitSelect).toHaveAttribute("aria-pressed", "true");
    expect(exitSelect).toHaveAttribute("data-variant", "primary");
    expect(exitSelect).toHaveAttribute("title", "Exit select mode");
    expect(screen.queryByRole("button", { name: "Select" })).not.toBeInTheDocument();

    fireEvent.click(exitSelect);

    expect(onAction).toHaveBeenCalledWith("select");
  });

  it("blocks click and enter search when search text is empty", () => {
    const onAction = vi.fn();
    render(
      <ImageViewerTopToolbar
        canActualSize
        canClearSearch
        canExport
        canFitHeight
        canFitPage
        canFitWidth
        canSearch
        canSelect
        canZoomIn
        canZoomOut
        selecting={false}
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText="  "
      />,
    );

    const searchForm = screen.getByLabelText("Image text search");
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchButton).toBeDisabled();

    fireEvent.click(searchButton);
    fireEvent.submit(searchForm);

    expect(onAction).not.toHaveBeenCalled();
  });

  it("runs search by click and enter when lens can search and text is present", () => {
    const onAction = vi.fn();
    render(
      <ImageViewerTopToolbar
        canActualSize
        canClearSearch
        canExport
        canFitHeight
        canFitPage
        canFitWidth
        canSearch
        canSelect
        canZoomIn
        canZoomOut
        selecting={false}
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText="Cedar"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.submit(screen.getByLabelText("Image text search"));

    expect(onAction).toHaveBeenCalledTimes(2);
    expect(onAction).toHaveBeenNthCalledWith(1, "search");
    expect(onAction).toHaveBeenNthCalledWith(2, "search");
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "search", source: "click" });
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "search", source: "submit" });
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
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "thumbs", page: 2, pageCount: 4 });
    expect(console.info).toHaveBeenCalledWith("imageviewer toolbar action", { action: "next", page: 2, pageCount: 4 });
    expect(screen.queryByText(/add|remove|reorder|export|draw/i)).not.toBeInTheDocument();
  });
});
