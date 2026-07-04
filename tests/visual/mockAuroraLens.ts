export type ViewerStatus = "idle" | "addingPages" | "loadingPage" | "loadingThumbnails" | "copyingSelection" | "ready" | "error";

export type ViewerState = {
  canActualSize?: boolean;
  canClearSelection?: boolean;
  canFitHeight?: boolean;
  canFitPage?: boolean;
  canFitWidth?: boolean;
  canGoFirst?: boolean;
  canGoLast?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  canSearch?: boolean;
  canShowThumbnails?: boolean;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  pageCount?: number;
  pageIndex?: number;
  viewMode?: "page" | "thumbnails";
};

type AuroraLensOptions = {
  allowEdit: boolean;
  onStateChange?: (state: ViewerState) => void;
  onStatusChange?: (status: ViewerStatus) => void;
};

export class IndexedDbViewerSessionStore {}

export function configurePdfWorker(_workerUrl: string) {}

const viewerState = {
  canActualSize: true,
  canClearSelection: true,
  canFitHeight: true,
  canFitPage: true,
  canFitWidth: true,
  canGoFirst: true,
  canGoLast: true,
  canGoNext: true,
  canGoPrevious: true,
  canSearch: true,
  canShowThumbnails: true,
  canZoomIn: true,
  canZoomOut: true,
  pageCount: 4,
  pageIndex: 1,
  viewMode: "page" as const,
};

export class AuroraLens {
  private readonly host: HTMLElement;
  private readonly options: AuroraLensOptions;
  private pageIndex = 1;

  constructor(host: HTMLElement, options: AuroraLensOptions) {
    this.host = host;
    this.options = options;
    this.host.dataset.allowEdit = String(options.allowEdit);
    this.host.innerHTML = '<div data-mock-lens-page="true">Mock multipage TIFF page</div>';
    this.options.onStateChange?.(viewerState);
    this.options.onStatusChange?.("idle");
  }

  private setPage(pageIndex: number) {
    this.pageIndex = Math.min(Math.max(pageIndex, 0), 3);
    this.host.dataset.currentPage = String(this.pageIndex + 1);
    this.host.dataset.currentPageIndex = String(this.pageIndex);
    this.options.onStateChange?.({
      ...viewerState,
      canGoFirst: this.pageIndex > 0,
      canGoLast: this.pageIndex < 3,
      canGoNext: this.pageIndex < 3,
      canGoPrevious: this.pageIndex > 0,
      pageIndex: this.pageIndex,
    });
  }

  actualSize() {
    this.host.dataset.fit = "actual";
  }

  clear() {
    this.host.dataset.cleared = "true";
  }

  clearSelection() {
    this.host.dataset.selection = "clear";
    delete this.host.dataset.searchText;
  }

  close() {
    this.host.dataset.closed = "true";
  }

  async decodeDoc(file: File, options: { page: number }) {
    this.options.onStatusChange?.("loadingPage");
    this.pageIndex = options.page;
    this.host.dataset.decodedPage = String(options.page + 1);
    this.host.dataset.decodedPageIndex = String(options.page);
    this.host.dataset.fileSize = String(file.size);
    this.host.dataset.fileType = file.type;
    this.setPage(options.page);
    this.options.onStatusChange?.("ready");
  }

  async firstPage() {
    await this.goToPage(0);
  }

  fitHeight() {
    this.host.dataset.fit = "height";
  }

  fitPage() {
    this.host.dataset.fit = "page";
  }

  fitWidth() {
    this.host.dataset.fit = "width";
  }

  async goToPage(page: number) {
    this.options.onStatusChange?.("loadingPage");
    this.setPage(page);
    this.options.onStatusChange?.("ready");
  }

  async lastPage() {
    await this.goToPage(3);
  }

  loadMetadata(metadata: unknown) {
    this.host.dataset.metadataLoaded = "true";
    if (metadata && typeof metadata === "object" && Array.isArray((metadata as { pages?: unknown }).pages)) {
      this.host.dataset.metadataPages = String((metadata as { pages: unknown[] }).pages.length);
    }
  }

  search(text: string, _options?: unknown) {
    this.host.dataset.searchText = text;
  }

  searchIndex(page: number, index: { value: string }, _options?: unknown) {
    this.host.dataset.searchIndex = `${page}:${index.value}`;
  }

  async nextPage() {
    await this.goToPage(this.pageIndex + 1);
  }

  async previousPage() {
    await this.goToPage(this.pageIndex - 1);
  }

  async restoreSession() {
    return false;
  }

  async showThumbnails() {
    this.options.onStatusChange?.("loadingThumbnails");
    this.host.dataset.thumbnails = "open";
    this.options.onStateChange?.({ ...viewerState, pageIndex: this.pageIndex, viewMode: "thumbnails" });
    this.options.onStatusChange?.("ready");
  }

  zoomIn() {
    this.host.dataset.zoom = "in";
  }

  zoomOut() {
    this.host.dataset.zoom = "out";
  }
}
