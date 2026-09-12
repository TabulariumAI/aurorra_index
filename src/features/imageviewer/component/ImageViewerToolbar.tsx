import { ConfButton } from "aurora-core";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import type { FormEvent, JSX } from "react";
import { imageViewerStyles } from "../style/imageViewerStyles";

type TopAction = "actualSize" | "clearSearch" | "export" | "fitHeight" | "fitPage" | "fitWidth" | "search" | "select" | "zoomIn" | "zoomOut";
type FooterAction = "first" | "last" | "next" | "previous" | "thumbs";

type TopProps = {
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
  pageCount: number;
};

type ButtonAction = TopAction | FooterAction;

function ViewerIcon({ name }: { name: ButtonAction }) {
  const paths = {
    actualSize: <><path d="M7 7h10v10H7z" /><path d="M4 4h4" /><path d="M4 4v4" /><path d="M20 20h-4" /><path d="M20 20v-4" /></>,
    clearSearch: <><path d="M5 8V5h3" /><path d="M16 5h3v3" /><path d="M19 16v3h-3" /><path d="M8 19H5v-3" /><path d="m10 10 8 8" /><path d="m18 10-8 8" /></>,
    export: <><path d="M12 3v12" /><path d="m8 7 4-4 4 4" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
    fitHeight: <><path d="M12 4v16" /><path d="m8 8 4-4 4 4" /><path d="m8 16 4 4 4-4" /><path d="M6 4h12" /><path d="M6 20h12" /></>,
    fitPage: <><rect x="6" y="4" width="12" height="16" rx="1" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" /></>,
    fitWidth: <><path d="M4 12h16" /><path d="m8 8-4 4 4 4" /><path d="m16 8 4 4-4 4" /><path d="M4 6v12" /><path d="M20 6v12" /></>,
    first: <><path d="M6 5v14" /><path d="m18 5-8 7 8 7" /></>,
    last: <><path d="M18 5v14" /><path d="m6 5 8 7-8 7" /></>,
    next: <path d="M9 5l8 7-8 7" />,
    previous: <path d="M15 5l-8 7 8 7" />,
    search: <><circle cx="10.5" cy="10.5" r="5" /><path d="m14.5 14.5 4.5 4.5" /></>,
    select: <><rect x="5" y="5" width="14" height="14" rx="1" /><path d="m8 10 4 4 4-5" /></>,
    thumbs: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    zoomIn: <><circle cx="10.5" cy="10.5" r="5.25" /><path d="m14.5 14.5 4.5 4.5" /><path d="M10.5 7.5v6" /><path d="M7.5 10.5h6" /></>,
    zoomOut: <><circle cx="10.5" cy="10.5" r="5.25" /><path d="m14.5 14.5 4.5 4.5" /><path d="M7.5 10.5h6" /></>,
  };
  return <svg aria-hidden="true" style={imageViewerStyles.icon} viewBox="0 0 24 24">{paths[name]}</svg>;
}

function ViewerButton({
  disabled,
  label,
  name,
  onClick,
  pressed,
}: {
  disabled?: boolean;
  label: string;
  name: ButtonAction;
  onClick(): void;
  pressed?: boolean;
}) {
  return (
    <ConfButton
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      label={<ViewerIcon name={name} />}
      onConfirm={onClick}
      requireConfirmation={false}
      size="icon"
      title={label}
      variant={pressed ? "primary" : "secondary"}
    />
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
  zoom,
}: TopProps): JSX.Element {
  const [scaleOpen, setScaleOpen] = useState(false);
  const canRunSearch = canSearch && Boolean(searchText.trim());
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRunSearch) return;
    console.info("imageviewer toolbar action", { action: "search", source: "submit" });
    onAction("search");
  };

  const viewControls = (
    <div aria-label="Image view controls" style={imageViewerStyles.viewGroup}>
        <div aria-label="Scale controls" style={imageViewerStyles.scaleGroup}>
          <ViewerButton disabled={!canZoomOut} label="Zoom out" name="zoomOut" onClick={() => {
            console.info("imageviewer toolbar action", { action: "zoomOut" });
            onAction("zoomOut");
          }} />
          {zoom === undefined ? null : <output aria-label="Current scale" aria-live="polite" style={imageViewerStyles.scaleValue}>{Math.round(zoom * 100)}%</output>}
          <ViewerButton disabled={!canZoomIn} label="Zoom in" name="zoomIn" onClick={() => {
            console.info("imageviewer toolbar action", { action: "zoomIn" });
            onAction("zoomIn");
          }} />
          <Popover.Root onOpenChange={setScaleOpen} open={scaleOpen}>
            <Popover.Trigger asChild>
              <button
                aria-controls="image-viewer-scale-options"
                aria-expanded={scaleOpen}
                aria-haspopup="dialog"
                aria-label="Scale options"
                disabled={!canActualSize && !canFitHeight && !canFitPage && !canFitWidth}
                style={imageViewerStyles.scaleButton}
                title="Scale options"
                type="button"
              >
                <ViewerIcon name="fitPage" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content aria-label="Scale options" id="image-viewer-scale-options" role="group" side="bottom" align="start" sideOffset={6} style={imageViewerStyles.scalePopover}>
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
    <form aria-label="Image text search" onSubmit={submitSearch} style={imageViewerStyles.searchForm}>
        <input
          aria-label="Search image text"
          onChange={(event) => {
            console.info("imageviewer toolbar search text", { length: event.target.value.length });
            onSearchText(event.target.value);
          }}
          placeholder="Search image text"
          style={imageViewerStyles.searchInput}
          type="search"
          value={searchText}
        />
        <ViewerButton disabled={!canRunSearch} label="Search" name="search" onClick={() => {
          console.info("imageviewer toolbar action", { action: "search", source: "click" });
          onAction("search");
        }} />
        <div aria-label="Selection controls" style={imageViewerStyles.selectionGroup}>
          <ViewerButton disabled={!canSelect} label={selecting ? "Exit select mode" : "Select"} name="select" onClick={() => {
            console.info("imageviewer toolbar action", { action: "select" });
            onAction("select");
          }} pressed={selecting} />
          <ViewerButton disabled={!canExport} label="Export" name="export" onClick={() => {
            console.info("imageviewer toolbar action", { action: "export" });
            onAction("export");
          }} />
        </div>
        <ViewerButton disabled={!canClearSearch} label="Clear selections" name="clearSearch" onClick={() => {
          console.info("imageviewer toolbar action", { action: "clearSearch" });
          onAction("clearSearch");
        }} />
    </form>
  );
  return (
    <div aria-label="Image viewer top toolbar" style={{ ...imageViewerStyles.topToolbar, ...(compact ? imageViewerStyles.topToolbarCompact : {}) }}>
      {viewControls}
      {searchControls}
    </div>
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
  pageCount,
}: FooterProps): JSX.Element {
  return (
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
      <span style={imageViewerStyles.pageText}>Page {page} of {pageCount}</span>
      <ViewerButton disabled={!canGoNext} label="Next page" name="next" onClick={() => {
        console.info("imageviewer toolbar action", { action: "next", page, pageCount });
        onAction("next");
      }} />
      <ViewerButton disabled={!canGoLast} label="Last page" name="last" onClick={() => {
        console.info("imageviewer toolbar action", { action: "last", page, pageCount });
        onAction("last");
      }} />
    </div>
  );
}
