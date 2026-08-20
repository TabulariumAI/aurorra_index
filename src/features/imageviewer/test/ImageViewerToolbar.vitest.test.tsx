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
        compact={false}
        selecting={false}
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={<button type="button">Close preview</button>}
        searchText="Cedar"
        zoom={1}
      />,
    );

    expect(screen.getByLabelText("Image viewer top toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("Image view controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Scale controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Current scale")).toHaveTextContent("100%");
    expect(screen.getByRole("button", { name: "Close preview" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search image text" })).toHaveAttribute("placeholder", "Search image text");
    const toolbar = screen.getByLabelText("Image viewer top toolbar");
    const close = screen.getByRole("button", { name: "Close preview" });
    const searchForm = screen.getByLabelText("Image text search");
    expect(toolbar).toHaveStyle({ display: "grid", gridTemplateColumns: "auto minmax(12rem, 1fr) auto" });
    expect(searchForm).toHaveStyle({ maxWidth: "none", minWidth: "0", width: "100%" });
    expect(screen.getByLabelText("Image view controls").parentElement).toBe(toolbar);
    expect(searchForm.parentElement).toBe(toolbar);
    expect(close.parentElement?.parentElement).toBe(toolbar);
    expect(
      screen.getByLabelText("Image view controls").compareDocumentPosition(searchForm),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(searchForm.compareDocumentPosition(close)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const searchBox = screen.getByRole("searchbox", { name: "Search image text" });
    const search = screen.getByRole("button", { name: "Search" });
    const select = screen.getByRole("button", { name: /^Select$/ });
    const exportButton = screen.getByRole("button", { name: "Export" });
    const clear = screen.getByRole("button", { name: "Clear selections" });
    expect(searchBox.compareDocumentPosition(search)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(search.compareDocumentPosition(select)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(select.compareDocumentPosition(exportButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(exportButton.compareDocumentPosition(clear)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(search);
    fireEvent.click(clear);
    fireEvent.click(select);
    fireEvent.click(exportButton);
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    const scaleOptions = screen.getByRole("button", { name: "Scale options" });
    expect(scaleOptions).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(scaleOptions);
    expect(scaleOptions).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Fit width" }));
    expect(screen.queryByRole("group", { name: "Scale options" })).not.toBeInTheDocument();
    fireEvent.click(scaleOptions);
    fireEvent.click(screen.getByRole("button", { name: "Fit height" }));
    fireEvent.click(scaleOptions);
    fireEvent.click(screen.getByRole("button", { name: "Fit page" }));
    fireEvent.click(scaleOptions);
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
    expect(scaleOptions).toHaveAttribute("title", "Scale options");
    expect(screen.queryByRole("button", { name: "Copy selected words" })).not.toBeInTheDocument();
  });

  it("keeps the close action in the first row in compact mode", () => {
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
        compact
        selecting={false}
        onAction={vi.fn()}
        onSearchText={vi.fn()}
        previewAction={<button type="button">Close preview</button>}
        searchText=""
        zoom={1}
      />,
    );

    const toolbar = screen.getByLabelText("Image viewer top toolbar");
    const primaryRow = toolbar.querySelector("[data-image-viewer-toolbar-row='primary']");
    expect(toolbar).toHaveStyle({ display: "grid" });
    expect(primaryRow).toHaveStyle({ display: "flex", justifyContent: "space-between" });
    expect(screen.getByLabelText("Image view controls").parentElement).toBe(primaryRow);
    expect(screen.getByRole("button", { name: "Close preview" }).parentElement?.parentElement).toBe(primaryRow);
    expect(screen.getByLabelText("Image text search").parentElement).toBe(toolbar);
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
        compact={false}
        selecting={false}
        onAction={onAction}
        onSearchText={onSearchText}
        previewAction={null}
        searchText="Cedar"
        zoom={1}
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

  it("keeps unavailable scale controls disabled", () => {
    render(
      <ImageViewerTopToolbar
        canActualSize={false}
        canClearSearch
        canExport
        canFitHeight={false}
        canFitPage={false}
        canFitWidth={false}
        canSearch
        canSelect
        canZoomIn={false}
        canZoomOut={false}
        compact={false}
        selecting={false}
        onAction={vi.fn()}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText=""
        zoom={0.5}
      />,
    );

    expect(screen.getByLabelText("Current scale")).toHaveTextContent("50%");
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Scale options" })).toBeDisabled();
  });

  it("keeps normal preview controls in one grid row", () => {
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
        compact={false}
        selecting={false}
        onAction={vi.fn()}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText=""
        zoom={1}
      />,
    );

    expect(screen.getByLabelText("Image viewer top toolbar")).toHaveStyle({ display: "grid", gridTemplateColumns: "auto minmax(12rem, 1fr) auto" });
    expect(screen.getByLabelText("Image text search")).toHaveStyle({ maxWidth: "none", minWidth: "0", width: "100%" });
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
        compact={false}
        selecting
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText=""
        zoom={1}
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
        compact={false}
        selecting={false}
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText="  "
        zoom={1}
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
        compact={false}
        selecting={false}
        onAction={onAction}
        onSearchText={vi.fn()}
        previewAction={null}
        searchText="Cedar"
        zoom={1}
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
    expect(screen.getByLabelText("Image viewer footer toolbar")).toHaveStyle({ padding: "0.55rem" });
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
