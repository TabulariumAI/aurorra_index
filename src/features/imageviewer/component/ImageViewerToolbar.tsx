import { ConfButton } from "aurorra-ui";
import type { FormEvent, JSX } from "react";
import { imageViewerStyles } from "../style/imageViewerStyles";

type TopAction = "actualSize" | "clearSearch" | "fitHeight" | "fitPage" | "fitWidth" | "search" | "zoomIn" | "zoomOut";
type FooterAction = "first" | "last" | "next" | "previous" | "thumbs";

type TopProps = {
  canActualSize: boolean;
  canClearSearch: boolean;
  canFitHeight: boolean;
  canFitPage: boolean;
  canFitWidth: boolean;
  canSearch: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onAction(action: TopAction): void;
  onSearchText(value: string): void;
  searchText: string;
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
    clearSearch: <><circle cx="10.5" cy="10.5" r="5" /><path d="m14.5 14.5 4.5 4.5" /><path d="M8.5 8.5l4 4" /><path d="M12.5 8.5l-4 4" /></>,
    fitHeight: <><path d="M12 4v16" /><path d="m8 8 4-4 4 4" /><path d="m8 16 4 4 4-4" /><path d="M6 4h12" /><path d="M6 20h12" /></>,
    fitPage: <><rect x="6" y="4" width="12" height="16" rx="1" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h4" /></>,
    fitWidth: <><path d="M4 12h16" /><path d="m8 8-4 4 4 4" /><path d="m16 8 4 4-4 4" /><path d="M4 6v12" /><path d="M20 6v12" /></>,
    first: <><path d="M6 5v14" /><path d="m18 5-8 7 8 7" /></>,
    last: <><path d="M18 5v14" /><path d="m6 5 8 7-8 7" /></>,
    next: <path d="M9 5l8 7-8 7" />,
    previous: <path d="M15 5l-8 7 8 7" />,
    search: <><circle cx="10.5" cy="10.5" r="5" /><path d="m14.5 14.5 4.5 4.5" /></>,
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
}: {
  disabled?: boolean;
  label: string;
  name: ButtonAction;
  onClick(): void;
}) {
  return (
    <ConfButton
      aria-label={label}
      disabled={disabled}
      label={<ViewerIcon name={name} />}
      onConfirm={onClick}
      requireConfirmation={false}
      size="icon"
      title={label}
      variant="secondary"
    />
  );
}

export function ImageViewerTopToolbar({
  canActualSize,
  canClearSearch,
  canFitHeight,
  canFitPage,
  canFitWidth,
  canSearch,
  canZoomIn,
  canZoomOut,
  onAction,
  onSearchText,
  searchText,
}: TopProps): JSX.Element {
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAction("search");
  };

  return (
    <div aria-label="Image viewer top toolbar" style={imageViewerStyles.topToolbar}>
      <div aria-label="Image view controls" style={imageViewerStyles.viewGroup}>
        <ViewerButton disabled={!canZoomOut} label="Zoom out" name="zoomOut" onClick={() => onAction("zoomOut")} />
        <ViewerButton disabled={!canZoomIn} label="Zoom in" name="zoomIn" onClick={() => onAction("zoomIn")} />
        <ViewerButton disabled={!canFitWidth} label="Fit width" name="fitWidth" onClick={() => onAction("fitWidth")} />
        <ViewerButton disabled={!canFitHeight} label="Fit height" name="fitHeight" onClick={() => onAction("fitHeight")} />
        <ViewerButton disabled={!canFitPage} label="Fit page" name="fitPage" onClick={() => onAction("fitPage")} />
        <ViewerButton disabled={!canActualSize} label="Actual size" name="actualSize" onClick={() => onAction("actualSize")} />
      </div>
      <form aria-label="Image text search" onSubmit={submitSearch} style={imageViewerStyles.searchForm}>
        <input
          aria-label="Search image text"
          disabled={!canSearch}
          onChange={(event) => onSearchText(event.target.value)}
          placeholder="Search image text"
          style={imageViewerStyles.searchInput}
          type="search"
          value={searchText}
        />
        <ViewerButton disabled={!canSearch} label="Search" name="search" onClick={() => onAction("search")} />
        <ViewerButton disabled={!canClearSearch} label="Clear search" name="clearSearch" onClick={() => onAction("clearSearch")} />
      </form>
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
      <ViewerButton disabled={!canShowThumbnails} label="Thumbnails" name="thumbs" onClick={() => onAction("thumbs")} />
      <ViewerButton disabled={!canGoFirst} label="First page" name="first" onClick={() => onAction("first")} />
      <ViewerButton disabled={!canGoPrevious} label="Previous page" name="previous" onClick={() => onAction("previous")} />
      <span style={imageViewerStyles.pageText}>Page {page} of {pageCount}</span>
      <ViewerButton disabled={!canGoNext} label="Next page" name="next" onClick={() => onAction("next")} />
      <ViewerButton disabled={!canGoLast} label="Last page" name="last" onClick={() => onAction("last")} />
    </div>
  );
}
