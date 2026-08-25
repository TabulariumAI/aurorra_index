import type { AuroraLens, DecodeDocOptions, MetadataIndex as LensMetadataIndex, ViewerState, ViewerStatus } from "@tabulariumai/aurora-lens";
import type { MetdataSelected } from "../../metdataview/type/metadataView.types";

export type PageRequest = {
  code: string;
  highlightOptions: { scroll: boolean };
  index: string;
  metadataIndex: LensMetadataIndex | null;
  page: number;
  quote: string;
  segment: string | null;
  session: string;
  value: string;
};

export type ViewerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type PackageData = {
  data: string;
  tiff: string;
};

export type PackageMetadata = {
  pages: unknown[];
};

export type HostInput = {
  apiGatewayUrl: string;
  authToken: string;
  onError: (error: ViewerError) => void;
  pageCount: number;
  pageMap: ReadonlyMap<string, string>;
  packagePollIntervalMs?: number;
  request: PageRequest | null;
  session: string;
  selectedIndex: MetdataSelected | null;
  workerClient?: WorkerClient;
};

export type PanelProps = {
  compact: boolean;
  hostInput?: HostInput;
  onLoaderChange?(lines: readonly string[] | null): void;
  onReadyChange(ready: boolean): void;
};

export type Status = "idle" | "packaging" | "polling" | "downloading" | "ready" | "error";

export type PackageStatus = "pending" | "processing" | "completed" | "error";

export type PackageResponse = {
  data: string;
  status: PackageStatus | string;
};

export type DataResponse = {
  data: PackageData;
  status: "completed";
};

export type PackageUrls = {
  jsonUrl: string;
  tiffUrl: string;
};

export type LocalPackage = {
  packageMetadata: PackageMetadata;
  tiffBytes: ArrayBuffer;
  tiffType: string;
};

export type WorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & ViewerError);

export type WorkerCommand =
  | { apiBaseUrl: string; session: string; token: string; type: "imagePackage" }
  | { apiBaseUrl: string; session: string; token: string; type: "imageStatus" }
  | { apiBaseUrl: string; session: string; token: string; type: "imageData" }
  | { token: string; tiffUrl: string; jsonUrl: string; type: "imageDownload" };

export type WorkerConfig = {
  apiBaseUrl: string;
};

export type WorkerClient = {
  packageImage(token: string, session: string): Promise<PackageResponse>;
  imageStatus(token: string, session: string): Promise<PackageResponse>;
  imageData(token: string, session: string): Promise<DataResponse>;
  downloadPackage(token: string, urls: PackageUrls): Promise<LocalPackage>;
};

export type LoadPackageInput = {
  apiGatewayUrl: string;
  authToken: string;
  onError: (error: ViewerError) => void;
  packagePollIntervalMs?: number;
  restart?: boolean;
  session: string;
  workerClient?: WorkerClient;
};

export type StoreState = {
  apiGatewayUrl: string;
  authToken: string | null;
  error: ViewerError | null;
  fitPageVersion: number;
  onError: ((error: ViewerError) => void) | null;
  pageCount: number;
  pageMap: ReadonlyMap<string, string>;
  packageMetadata: PackageMetadata | null;
  packagePollIntervalMs: number;
  packageStatus: PackageStatus | null;
  packageVersion: number;
  request: PageRequest | null;
  requestVersion: number;
  searchText: string;
  selectedIndex: MetdataSelected | null;
  session: string | null;
  status: Status;
  tiffBytes: ArrayBuffer | null;
  tiffType: string | null;
  thumbsOpen: boolean;
  viewerState: ViewerState | null;
  viewerStatus: ViewerStatus;
  workerClient: WorkerClient | null;
  resetLens(): void;
  resetViewer(): void;
  fitPage(): void;
  setError(error: ViewerError): void;
  setHostInput(input: HostInput): void;
  setLocalPackage(value: LocalPackage): void;
  setPackageStatus(status: PackageStatus | null): void;
  setReady(): void;
  setRequest(request: PageRequest): void;
  setSearchText(value: string): void;
  setStatus(status: Status): void;
  setThumbsOpen(open: boolean): void;
  setViewerState(state: ViewerState | null): void;
  setViewerStatus(status: ViewerStatus): void;
};

export type LensApi = Pick<
  AuroraLens,
  | "actualSize"
  | "clear"
  | "clearSelection"
  | "close"
  | "copySelection"
  | "decodeDoc"
  | "firstPage"
  | "fitHeight"
  | "fitPage"
  | "fitWidth"
  | "goToPage"
  | "lastPage"
  | "loadMetadata"
  | "nextPage"
  | "previousPage"
  | "readPageInfo"
  | "restoreSession"
  | "search"
  | "searchIndex"
  | "setDrawMode"
  | "showThumbnails"
  | "zoomIn"
  | "zoomOut"
> & {
  decodeDoc(file: File, options: DecodeDocOptions): Promise<void>;
};
