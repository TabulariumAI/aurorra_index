import { ConfButton, rowStyles } from "aurora-core";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useLayoutEffect, useRef, useState } from "react";
import type { FormEvent, JSX, Ref } from "react";
import { imageViewerStyles } from "../style/imageViewerStyles";

type TopAction = "actualSize" | "clearSearch" | "copy" | "export" | "fitHeight" | "fitPage" | "fitWidth" | "match" | "search" | "select" | "zoomIn" | "zoomOut";
type FooterAction = "first" | "last" | "next" | "previous" | "thumbs";

type TopProps = {
  scaleRef?: Ref<HTMLButtonElement>;
  exportRef?: Ref<HTMLButtonElement>;
  canActualSize: boolean;
  canClearSearch: boolean;
  canExport: boolean;
  canFitHeight: boolean;
  canFitPage: boolean;
  canFitWidth: boolean;
  canSearch: boolean;
  canSelect: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  compact: boolean;
  selecting: boolean;
  onAction(action: TopAction): void;
  onSearchText(value: string): void;
  searchText: string;
  zoom: number | undefined;
};

type FooterProps = {
  canGoFirst: boolean;
  canGoLast: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  canShowThumbnails: boolean;
  onAction(action: FooterAction): void;
  page: number;
  pageName: string | null | undefined;
  pageCount: number;
};

type ButtonAction = TopAction | FooterAction;

function ViewerIcon({ name }: { name: ButtonAction | "more" }) {
  const paths = {
    actualSize: <><path d="M7 7h10v10H7z" /><path d="M4 4h4" /><path d="M4 4v4" /><path d="M20 20h-4" /><path d="M20 20v-4" /></>,
    clearSearch: <><rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></>,
    copy: <><rect x="8" y="8" width="11" height="12" rx="1" /><path d="M16 8V5a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2" /></>,
    export: <><path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
    fitHeight: <><path d="M12 4v16" /><path d="m8 8 4-4 4 4" /><path d="m8 16 4 4 4-4" /><path d="M6 4h12" /><path d="M6 20h12" /></>,
    fitPage: <><rect x="6" y="4" width="12" height="16" rx="1" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" /></>,
    fitWidth: <><path d="M4 12h16" /><path d="m8 8-4 4 4 4" /><path d="m16 8 4 4-4 4" /><path d="M4 6v12" /><path d="M20 6v12" /></>,
    first: <><path d="M6 5v14" /><path d="m18 5-8 7 8 7" /></>,
    last: <><path d="M18 5v14" /><path d="m6 5 8 7-8 7" /></>,
    match: <><circle cx="10.5" cy="10.5" r="5" /><path d="m14.5 14.5 4.5 4.5" /><path d="m8.5 10.5 1.5 1.5 3-3" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    next: <path d="M9 5l8 7-8 7" />,
    previous: <path d="M15 5l-8 7 8 7" />,
    search: <><circle cx="10.5" cy="10.5" r="5" /><path d="m14.5 14.5 4.5 4.5" /></>,
    select: <><rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 2" /><path d="m9 11 2 2 4-4" /></>,
    thumbs: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    zoomIn: <><circle cx="10.5" cy="10.5" r="5.25" /><path d="m14.5 14.5 4.5 4.5" /><path d="M10.5 7.5v6" /><path d="M7.5 10.5h6" /></>,
    zoomOut: <><circle cx="10.5" cy="10.5" r="5.25" /><path d="m14.5 14.5 4.5 4.5" /><path d="M7.5 10.5h6" /></>,
  };
  return <svg aria-hidden="true" style={imageViewerStyles.icon} viewBox="0 0 24 24">{paths[name]}</svg>;
}

function ViewerButton({
  compact,
  disabled,
  label,
  name,
  onClick,
  pressed,
}: {
  compact?: boolean;
  disabled?: boolean;
  label: string;
  name: ButtonAction;
  onClick(): void;
  pressed?: boolean;
}) {
  return (
    <Tooltip.Root><Tooltip.Trigger asChild>
    <ConfButton
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      label={<ViewerIcon name={name} />}
      onConfirm={onClick}
      requireConfirmation={false}
      size="icon"
      style={{ ...(compact ? imageViewerStyles.compactButton : {}), ...(pressed ? imageViewerStyles.activeButton : {}) }}
      variant="secondary"
    />
    </Tooltip.Trigger><Tooltip.Portal><Tooltip.Content sideOffset={6} style={rowStyles.tooltip}>
      {label}
    </Tooltip.Content></Tooltip.Portal></Tooltip.Root>
  );
}

export function ImageViewerTopToolbar({
  canActualSize,
  canClearSearch,
  canExport,
  canFitHeight,
  canFitPage,
  canFitWidth,
  canSearch,
  canSelect,
  canZoomIn,
  canZoomOut,
  compact,
  selecting,
  onAction,
  onSearchText,
  searchText,
  scaleRef,
  exportRef,
  zoom,
}: TopProps): JSX.Element {
  const [scaleOpen, setScaleOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(true);
  const openingExportRef = useRef(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const canRunSearch = canSearch && Boolean(searchText.trim());
  useLayoutEffect(() => {
    const toolbar = toolbarRef.current!;
    const view = viewRef.current!;
    const form = formRef.current!;
    const input = inputRef.current!;
    const submit = submitRef.current!;
    const selection = selectionRef.current!;
    const searchBox = input.parentElement!;
    const measure = () => {
      if (toolbar.clientWidth === 0) return;
      const toolbarStyle = getComputedStyle(toolbar);
      const formStyle = getComputedStyle(form);
      const boxStyle = getComputedStyle(searchBox);
      const selectionStyle = getComputedStyle(selection);
      const availableWidth = toolbar.clientWidth - parseFloat(toolbarStyle.paddingLeft) - parseFloat(toolbarStyle.paddingRight);
      const minimumWidth = view.getBoundingClientRect().width
        + parseFloat(toolbarStyle.columnGap)
        + parseFloat(getComputedStyle(input).minWidth)
        + submit.getBoundingClientRect().width
        + parseFloat(boxStyle.borderLeftWidth)
        + parseFloat(boxStyle.borderRightWidth)
        + parseFloat(formStyle.columnGap)
        + selection.getBoundingClientRect().width
        + parseFloat(selectionStyle.marginLeft)
        + parseFloat(selectionStyle.marginRight);
      const fits = availableWidth >= minimumWidth;
      setSearchVisible(fits);
      if (!fits) setMoreOpen(false);
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const element of [toolbar, view, submit, selection]) observer.observe(element);
    return () => observer.disconnect();
  }, [compact]);
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRunSearch) return;
    console.info("imageviewer toolbar action", { action: "search", source: "submit" });
    onAction("search");
  };

  const viewControls = (
    <div aria-label="Image view controls" ref={viewRef} style={imageViewerStyles.viewGroup}>
        <div aria-label="Scale controls" style={imageViewerStyles.scaleGroup}>
          <ViewerButton compact={compact} disabled={!canZoomOut} label="Zoom out" name="zoomOut" onClick={() => {
            console.info("imageviewer toolbar action", { action: "zoomOut" });
            onAction("zoomOut");
          }} />
          {zoom === undefined ? null : <output aria-label="Current scale" aria-live="polite" style={{ ...imageViewerStyles.scaleValue, ...(compact ? imageViewerStyles.compactScaleValue : {}) }}>{Math.round(zoom * 100)}%</output>}
          <ViewerButton compact={compact} disabled={!canZoomIn} label="Zoom in" name="zoomIn" onClick={() => {
            console.info("imageviewer toolbar action", { action: "zoomIn" });
            onAction("zoomIn");
          }} />
          <Popover.Root onOpenChange={setScaleOpen} open={scaleOpen}>
            <Tooltip.Root><Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <button
                ref={scaleRef}
                aria-controls="image-viewer-scale-options"
                aria-expanded={scaleOpen}
                aria-haspopup="dialog"
                aria-label="Scale options"
                disabled={!canActualSize && !canFitHeight && !canFitPage && !canFitWidth}
                style={{ ...imageViewerStyles.menuButton, ...(compact ? imageViewerStyles.compactButton : {}) }}
                type="button"
              >
                <ViewerIcon name="more" />
              </button>
            </Popover.Trigger>
            </Tooltip.Trigger><Tooltip.Portal><Tooltip.Content sideOffset={6} style={rowStyles.tooltip}>
              Scale options
            </Tooltip.Content></Tooltip.Portal></Tooltip.Root>
            <Popover.Portal>
              <Popover.Content aria-label="Scale options" id="image-viewer-scale-options" role="group" side="bottom" align="start" sideOffset={6} style={imageViewerStyles.menuPopover} onCloseAutoFocus={(event) => {
                if (openingExportRef.current) event.preventDefault();
                openingExportRef.current = false;
              }}>
                <ConfButton disabled={!canFitPage} label="Fit page" onConfirm={() => {
                  setScaleOpen(false);
                  console.info("imageviewer toolbar action", { action: "fitPage" });
                  onAction("fitPage");
                }} requireConfirmation={false} size="sm" variant="secondary" />
                <ConfButton disabled={!canFitWidth} label="Fit width" onConfirm={() => {
                  setScaleOpen(false);
                  console.info("imageviewer toolbar action", { action: "fitWidth" });
                  onAction("fitWidth");
                }} requireConfirmation={false} size="sm" variant="secondary" />
                <ConfButton disabled={!canFitHeight} label="Fit height" onConfirm={() => {
                  setScaleOpen(false);
                  console.info("imageviewer toolbar action", { action: "fitHeight" });
                  onAction("fitHeight");
                }} requireConfirmation={false} size="sm" variant="secondary" />
                <ConfButton disabled={!canActualSize} label="Actual size" onConfirm={() => {
                  setScaleOpen(false);
                  console.info("imageviewer toolbar action", { action: "actualSize" });
                  onAction("actualSize");
                }} requireConfirmation={false} size="sm" variant="secondary" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
    </div>
  );
  const searchControls = (
    <form aria-hidden={!searchVisible} aria-label="Image text search" inert={!searchVisible} onSubmit={submitSearch} ref={formRef} style={{ ...imageViewerStyles.searchForm, ...(!searchVisible ? imageViewerStyles.hiddenSearchForm : {}) }}>
        <div style={imageViewerStyles.searchBox}>
        <input
          aria-label="Search image text"
          ref={inputRef}
          onChange={(event) => {
            console.info("imageviewer toolbar search text", { length: event.target.value.length });
            onSearchText(event.target.value);
          }}
          placeholder="Search image text"
          style={imageViewerStyles.searchInput}
          type="search"
          value={searchText}
        />
        <Tooltip.Root><Tooltip.Trigger asChild>
        <button aria-label="Search" disabled={!canRunSearch} ref={submitRef} style={{ ...imageViewerStyles.searchSubmit, ...(compact ? imageViewerStyles.compactSearchSubmit : {}) }} type="button" onClick={() => {
          console.info("imageviewer toolbar action", { action: "search", source: "click" });
          onAction("search");
        }}><ViewerIcon name="search" /></button>
        </Tooltip.Trigger><Tooltip.Portal><Tooltip.Content sideOffset={6} style={rowStyles.tooltip}>
          Search
        </Tooltip.Content></Tooltip.Portal></Tooltip.Root>
        </div>
        <div aria-label="Selection controls" ref={selectionRef} style={{ ...imageViewerStyles.selectionGroup, ...(compact ? imageViewerStyles.compactSelectionGroup : {}) }}>
          <ViewerButton compact={compact} disabled={!canSelect} label={selecting ? "Exit select mode" : "Select"} name="select" onClick={() => {
            console.info("imageviewer toolbar action", { action: "select" });
            onAction("select");
          }} pressed={selecting} />
          <ViewerButton compact={compact} disabled={!canClearSearch} label="Clear selections" name="clearSearch" onClick={() => {
          console.info("imageviewer toolbar action", { action: "clearSearch" });
          onAction("clearSearch");
        }} />
          <Popover.Root onOpenChange={setMoreOpen} open={moreOpen}>
            <Tooltip.Root><Tooltip.Trigger asChild>
            <Popover.Trigger asChild>
              <button ref={exportRef} aria-controls="image-viewer-more-options" aria-expanded={moreOpen} aria-haspopup="dialog" aria-label="More" disabled={!canExport} style={{ ...imageViewerStyles.menuButton, ...(compact ? imageViewerStyles.compactButton : {}) }} type="button">
                <ViewerIcon name="more" />
              </button>
            </Popover.Trigger>
            </Tooltip.Trigger><Tooltip.Portal><Tooltip.Content sideOffset={6} style={rowStyles.tooltip}>
              More
            </Tooltip.Content></Tooltip.Portal></Tooltip.Root>
            <Popover.Portal>
              <Popover.Content aria-label="Selection actions" id="image-viewer-more-options" role="group" side="bottom" align="end" sideOffset={6} style={imageViewerStyles.menuPopover} onCloseAutoFocus={(event) => {
                if (openingExportRef.current) event.preventDefault();
                openingExportRef.current = false;
              }}>
                {(["export", "copy", "match"] as const).map((action) => <ConfButton key={action} label={action[0].toUpperCase() + action.slice(1)} onConfirm={() => {
                  openingExportRef.current = action === "export";
                  setMoreOpen(false);
                  console.info("imageviewer toolbar action", { action });
                  onAction(action);
                }} requireConfirmation={false} size="sm" variant="secondary" />)}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
    </form>
  );
  return (
    <Tooltip.Provider>
    <div aria-label="Image viewer top toolbar" ref={toolbarRef} style={{ ...imageViewerStyles.topToolbar, ...(compact ? imageViewerStyles.topToolbarCompact : {}) }}>
      {viewControls}
      {searchControls}
    </div>
    </Tooltip.Provider>
  );
}

export function ImageViewerFooterToolbar({
  canGoFirst,
  canGoLast,
  canGoNext,
  canGoPrevious,
  canShowThumbnails,
  onAction,
  page,
  pageName,
  pageCount,
}: FooterProps): JSX.Element {
  return (
    <Tooltip.Provider>
    <div aria-label="Image viewer footer toolbar" style={imageViewerStyles.footerToolbar}>
      <ViewerButton disabled={!canShowThumbnails} label="Thumbnails" name="thumbs" onClick={() => {
        console.info("imageviewer toolbar action", { action: "thumbs", page, pageCount });
        onAction("thumbs");
      }} />
      <ViewerButton disabled={!canGoFirst} label="First page" name="first" onClick={() => {
        console.info("imageviewer toolbar action", { action: "first", page, pageCount });
        onAction("first");
      }} />
      <ViewerButton disabled={!canGoPrevious} label="Previous page" name="previous" onClick={() => {
        console.info("imageviewer toolbar action", { action: "previous", page, pageCount });
        onAction("previous");
      }} />
      <span style={imageViewerStyles.pageText}>Page {page}{pageName ? ` (${pageName})` : ""} of {pageCount}</span>
      <ViewerButton disabled={!canGoNext} label="Next page" name="next" onClick={() => {
        console.info("imageviewer toolbar action", { action: "next", page, pageCount });
        onAction("next");
      }} />
      <ViewerButton disabled={!canGoLast} label="Last page" name="last" onClick={() => {
        console.info("imageviewer toolbar action", { action: "last", page, pageCount });
        onAction("last");
      }} />
    </div>
    </Tooltip.Provider>
  );
}
