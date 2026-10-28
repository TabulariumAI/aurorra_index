import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageViewerFooterToolbar, ImageViewerTopToolbar } from "../component/ImageViewerToolbar";

describe("ImageViewerToolbar", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps search inside its border and exposes selection actions through More", () => {
    const onAction = vi.fn();
    render(<ImageViewerTopToolbar
      canActualSize canClearSearch canExport canFitHeight canFitPage canFitWidth
      canSearch canSelect canZoomIn canZoomOut compact={false} selecting={false}
      onAction={onAction} onSearchText={vi.fn()} searchText="APN" zoom={1}
    />);

    const searchBox = screen.getByRole("searchbox", { name: "Search image text" });
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchBox.parentElement).toContainElement(searchButton);
    expect(searchBox.parentElement?.style.border).toBe("1px solid var(--border-card)");
    const select = screen.getByRole("button", { name: "Select" });
    const clear = screen.getByRole("button", { name: "Clear selections" });
    expect(select.compareDocumentPosition(clear)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(clear.compareDocumentPosition(screen.getByRole("button", { name: "More" }))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(screen.getByRole("button", { name: "More" }));
    for (const action of ["Export", "Copy", "Match"]) {
      expect(screen.getByRole("button", { name: action })).toBeVisible();
    }
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(onAction).toHaveBeenCalledWith("copy");
    expect(screen.queryByRole("button", { name: "Copy" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Match" }));
    expect(onAction).toHaveBeenCalledWith("match");
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
        searchText="Cedar"
        zoom={1}
      />,
    );

    expect(screen.getByLabelText("Image viewer top toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("Image view controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Scale controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Current scale")).toHaveTextContent("100%");
    expect(screen.getByRole("searchbox", { name: "Search image text" })).toHaveAttribute("placeholder", "Search image text");
    const toolbar = screen.getByLabelText("Image viewer top toolbar");
    const searchForm = screen.getByLabelText("Image text search");
    expect(toolbar).toHaveStyle({ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)" });
    expect(searchForm).toHaveStyle({ maxWidth: "none", minWidth: "0", width: "100%" });
    expect(screen.getByLabelText("Image view controls").parentElement).toBe(toolbar);
    expect(searchForm.parentElement).toBe(toolbar);
    expect(
      screen.getByLabelText("Image view controls").compareDocumentPosition(searchForm),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    const searchBox = screen.getByRole("searchbox", { name: "Search image text" });
    const search = screen.getByRole("button", { name: "Search" });
    const select = screen.getByRole("button", { name: /^Select$/ });
    const clear = screen.getByRole("button", { name: "Clear selections" });
    const more = screen.getByRole("button", { name: "More" });
    expect(searchBox.compareDocumentPosition(search)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(search.compareDocumentPosition(select)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(select.compareDocumentPosition(clear)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(clear.compareDocumentPosition(more)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    fireEvent.click(search);
    fireEvent.click(clear);
    fireEvent.click(select);
    fireEvent.click(more);
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
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
    expect(scaleOptions).not.toHaveAttribute("title");
    expect(screen.queryByRole("button", { name: "Copy selected words" })).not.toBeInTheDocument();
  });

  it("keeps compact controls in one row", () => {
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
        searchText=""
        zoom={1}
      />,
    );

    const toolbar = screen.getByLabelText("Image viewer top toolbar");

    expect(toolbar).toHaveStyle({ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)" });

    expect(screen.getByLabelText("Image view controls").parentElement).toBe(toolbar);
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
        searchText="Cedar"
        zoom={1}
      />,
    );

    const searchBox = screen.getByRole("searchbox", { name: "Search image text" });
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchBox).toBeEnabled();
    expect(searchButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "More" })).toBeDisabled();

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
        searchText=""
        zoom={1}
      />,
    );

    expect(screen.getByLabelText("Image viewer top toolbar")).toHaveStyle({ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)" });
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
        searchText=""
        zoom={1}
      />,
    );

    const exitSelect = screen.getByRole("button", { name: "Exit select mode" });
    expect(exitSelect).toHaveAttribute("aria-pressed", "true");
    expect(exitSelect).toHaveAttribute("data-variant", "secondary");
    expect(exitSelect.style.background).toBe("var(--white)");
    expect(exitSelect.style.boxShadow).toBe("inset 0 0 0 2px var(--primary)");
    expect(exitSelect).toHaveStyle({ color: "var(--primary-dark)" });
    expect(exitSelect).not.toHaveAttribute("title");
    act(() => exitSelect.focus());
    expect(screen.getByRole("tooltip")).toHaveTextContent("Exit select mode");
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
        pageName="26"
        pageCount={4}
      />,
    );

    expect(screen.getByLabelText("Image viewer footer toolbar")).toBeInTheDocument();
    expect(screen.getByLabelText("Image viewer footer toolbar")).toHaveStyle({ padding: "0.55rem" });
    expect(screen.getByText("Page 2 (26) of 4")).toBeInTheDocument();
    expect(screen.queryByText("Page 2 of 4")).not.toBeInTheDocument();

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

it.each(["01", "Exhibit-A", "26", "2", null, undefined, ""])("shows the position and optional name %s in the footer", pageName => {
  render(<ImageViewerFooterToolbar canGoFirst canGoLast canGoNext canGoPrevious canShowThumbnails onAction={vi.fn()} page={2} pageName={pageName} pageCount={4} />);
  expect(screen.getByText(pageName ? `Page 2 (${pageName}) of 4` : "Page 2 of 4")).toBeVisible();
  expect(screen.getByLabelText("Image viewer footer toolbar")).not.toHaveTextContent("()");
});

it.each(["Zoom out", "Zoom in", "Scale options", "Search", "Select", "Clear selections", "More"])("shows the %s top action tooltip on focus", async label => {
  render(<ImageViewerTopToolbar canActualSize canClearSearch canExport canFitHeight canFitPage canFitWidth canSearch canSelect canZoomIn canZoomOut compact={false} selecting={false} onAction={vi.fn()} onSearchText={vi.fn()} searchText="Cedar" zoom={1} />);
  const button = screen.getByRole("button", { name: label });
  expect(button).not.toHaveAttribute("title");
  act(() => button.focus());
  expect(await screen.findByRole("tooltip")).toHaveTextContent(label);
  expect(button).toHaveAccessibleDescription(label);
  fireEvent.keyDown(button, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(button).toHaveFocus();
});

it.each(["Thumbnails", "First page", "Previous page", "Next page", "Last page"])("shows the %s footer action tooltip on focus", async label => {
  render(<ImageViewerFooterToolbar canGoFirst canGoLast canGoNext canGoPrevious canShowThumbnails onAction={vi.fn()} page={2} pageName={null} pageCount={4} />);
  const button = screen.getByRole("button", { name: label });
  expect(button).not.toHaveAttribute("title");
  act(() => button.focus());
  expect(await screen.findByRole("tooltip")).toHaveTextContent(label);
  expect(button).toHaveAccessibleDescription(label);
  fireEvent.keyDown(button, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(button).toHaveFocus();
});

it("keeps unavailable footer actions natively disabled without adding focus targets", () => {
  const onAction = vi.fn();
  render(<ImageViewerFooterToolbar canGoFirst={false} canGoLast={false} canGoNext={false} canGoPrevious={false} canShowThumbnails={false} onAction={onAction} page={1} pageName={null} pageCount={1} />);
  const buttons = screen.getAllByRole("button");
  expect(buttons).toHaveLength(5);
  for (const button of buttons) {
    expect(button).toBeDisabled();
    fireEvent.click(button);
    act(() => button.focus());
    expect(button).not.toHaveFocus();
  }
  expect(onAction).not.toHaveBeenCalled();
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
