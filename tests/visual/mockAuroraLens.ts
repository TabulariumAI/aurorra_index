export type ViewerStatus = "idle" | "addingPages" | "loadingPage" | "loadingThumbnails" | "copyingSelection" | "ready" | "error";

export type ViewerState = {
  canActualSize?: boolean;
  canClearSelection?: boolean;
  canCopy?: boolean;
  canDraw?: boolean;
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
  metadataPageCount?: number;
  pageCount?: number;
  pageIndex?: number;
  pageInfo?: { class: string | null; indexes: unknown[]; pageNumber: number; segments: string[] } | null;
  status?: ViewerStatus;
  drawMode?: boolean;
  viewMode?: "page" | "thumbnails";
  zoom?: number;
};

type AuroraLensOptions = {
  allowEdit: boolean;
  onStateChange?: (state: ViewerState) => void;
  onStatusChange?: (status: ViewerStatus) => void;
};

export class IndexedDbViewerSessionStore {}

export function configurePdfWorker(_workerUrl: string) {}

function viewerState(pageIndex = 1, drawMode = false, zoom = 1): ViewerState {
  const metadataReady = new URLSearchParams(window.location.search).get("metadata") !== "missing";
  return {
    canActualSize: true,
    canClearSelection: true,
    canCopy: true,
    canDraw: true,
    canFitHeight: true,
    canFitPage: true,
    canFitWidth: true,
    canGoFirst: pageIndex > 0,
    canGoLast: pageIndex < 3,
    canGoNext: pageIndex < 3,
    canGoPrevious: pageIndex > 0,
    canSearch: metadataReady,
    canShowThumbnails: true,
    canZoomIn: true,
    canZoomOut: true,
    metadataPageCount: metadataReady ? 5 : 0,
    pageCount: 4,
    pageIndex,
    pageInfo: metadataReady ? { class: "Deed", indexes: [], pageNumber: pageIndex + 1, segments: [] } : null,
    status: "ready",
    drawMode,
    viewMode: "page",
    zoom,
  };
}

export class AuroraLens {
  private readonly host: HTMLElement;
  private readonly options: AuroraLensOptions;
  private pageIndex = 1;
  private drawMode = false;
  private zoom = 1;

  constructor(host: HTMLElement, options: AuroraLensOptions) {
    this.host = host;
    this.options = options;
    this.host.dataset.allowEdit = String(options.allowEdit);
    this.host.innerHTML = '<div data-mock-lens-page="true">Mock multipage TIFF page</div>';
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
    this.options.onStatusChange?.("idle");
  }

  private setPage(pageIndex: number) {
    this.pageIndex = Math.min(Math.max(pageIndex, 0), 3);
    this.host.dataset.currentPage = String(this.pageIndex + 1);
    this.host.dataset.currentPageIndex = String(this.pageIndex);
    this.options.onStateChange?.({
      ...viewerState(this.pageIndex, this.drawMode, this.zoom),
    });
  }

  actualSize() {
    this.zoom = 1;
    this.host.dataset.fit = "actual";
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
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

  async copySelection() {
    this.options.onStatusChange?.("copyingSelection");
    this.host.dataset.selection = "copied";
    this.options.onStatusChange?.("ready");
    return {
      copied: true,
      groups: [
        {
          value: {
            context: ["JOHN SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385 PARTY OF THE FIRST PART, AND"],
            kind: ["BODY"],
            token: ["JOHN", "SMITH,"],
          },
        },
        {
          value: {
            context: ["JOHN SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385 PARTY OF THE FIRST PART, AND"],
            kind: ["BODY"],
            token: ["JOHN SMITH"],
          },
        },
        {
          value: {
            context: ["JOHN SMITH"],
            kind: ["BODY"],
            token: ["JOHN SMITH"],
          },
        },
        {
          value: {
            context: ["JOHN M. SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385, AS TRUSTEE OF THE JOHN M. SMITH LIVING TRUST, DATED JUNE 9, 2025"],
            kind: ["BODY"],
            token: ["JOHN M. SMITH"],
          },
        },
      ],
      text: "JOHN SMITH\nJOHN M. SMITH",
    };
  }

  readPageInfo() {
    return {
      class: "Deed",
      indexes: [],
      pageNumber: this.pageIndex + 1,
      segments: [],
    };
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
    this.zoom = 0.6;
    this.host.dataset.fit = "height";
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
  }

  fitPage() {
    this.zoom = 0.5;
    this.host.dataset.fit = "page";
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
  }

  fitWidth() {
    this.zoom = 0.75;
    this.host.dataset.fit = "width";
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
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

  setDrawMode(enabled: boolean) {
    this.drawMode = enabled;
    this.host.dataset.drawMode = String(enabled);
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
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
    this.options.onStateChange?.({ ...viewerState(this.pageIndex, this.drawMode, this.zoom), viewMode: "thumbnails" });
    this.options.onStatusChange?.("ready");
  }

  zoomIn() {
    this.zoom = Math.min(8, this.zoom * 1.2);
    this.host.dataset.zoom = "in";
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
  }

  zoomOut() {
    this.zoom = Math.max(0.5, this.zoom / 1.2);
    this.host.dataset.zoom = "out";
    this.options.onStateChange?.(viewerState(this.pageIndex, this.drawMode, this.zoom));
  }
}
