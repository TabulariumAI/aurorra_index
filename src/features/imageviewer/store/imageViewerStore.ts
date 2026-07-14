import { create } from "zustand";
import type { StoreState } from "../type/imageViewer.types";

const DEFAULT_POLL_INTERVAL_MS = 1500;

export const useImageViewerStore = create<StoreState>()((set, get) => ({
  apiGatewayUrl: "",
  authToken: null,
  error: null,
  onError: null,
  onJobEvent: null,
  pageCount: 1,
  pageMap: new Map(),
  packageMetadata: null,
  packagePollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
  packageStatus: null,
  packageVersion: 0,
  request: null,
  searchText: "",
  selectedIndex: null,
  session: null,
  status: "idle",
  tiffBytes: null,
  tiffType: null,
  thumbsOpen: false,
  viewerState: null,
  viewerStatus: "idle",
  workerClient: null,
  resetLens() {
    const current = get();
    const hasPackage = Boolean(current.packageMetadata && current.tiffBytes && current.tiffType !== null);
    set({
      error: null,
      packageStatus: hasPackage ? "completed" : null,
      searchText: "",
      status: hasPackage ? "ready" : "idle",
      thumbsOpen: false,
      viewerState: null,
      viewerStatus: "idle",
    });
  },
  resetViewer() {
    set({
      apiGatewayUrl: "",
      authToken: null,
      error: null,
      onError: null,
      onJobEvent: null,
      pageCount: 1,
      pageMap: new Map(),
      packageMetadata: null,
      packagePollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      packageStatus: null,
      packageVersion: 0,
      request: null,
      searchText: "",
      selectedIndex: null,
      session: null,
      status: "idle",
      tiffBytes: null,
      tiffType: null,
      thumbsOpen: false,
      viewerState: null,
      viewerStatus: "idle",
      workerClient: null,
    });
  },
  setError(error) {
    get().onError?.(error);
    set({ error, status: "error" });
  },
  setHostInput(input) {
    const current = get();
    const sameSession = current.session === input.session;
    set({
      apiGatewayUrl: input.apiGatewayUrl,
      authToken: input.authToken,
      error: null,
      onError: input.onError,
      onJobEvent: input.onJobEvent,
      pageCount: input.pageCount,
      pageMap: new Map(input.pageMap),
      packageMetadata: sameSession ? current.packageMetadata : null,
      packagePollIntervalMs: input.packagePollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
      packageStatus: sameSession ? current.packageStatus : null,
      packageVersion: sameSession ? current.packageVersion : 0,
      request: input.request,
      selectedIndex: input.selectedIndex,
      session: input.session,
      status: sameSession ? current.status : "idle",
      tiffBytes: sameSession ? current.tiffBytes : null,
      tiffType: sameSession ? current.tiffType : null,
      workerClient: input.workerClient ?? null,
    });
  },
  setLocalPackage(value) {
    set({
      error: null,
      packageMetadata: value.packageMetadata,
      packageStatus: "completed",
      packageVersion: get().packageVersion + 1,
      status: "ready",
      tiffBytes: value.tiffBytes,
      tiffType: value.tiffType,
    });
  },
  setPackageStatus(status) {
    set({ packageStatus: status });
  },
  setReady() {
    set({ error: null, status: "ready" });
  },
  setRequest(request) {
    set({ request });
  },
  setSearchText(value) {
    set({ searchText: value });
  },
  setStatus(status) {
    set({ status });
  },
  setThumbsOpen(open) {
    set({ thumbsOpen: open });
  },
  setViewerState(state) {
    set({ viewerState: state });
  },
  setViewerStatus(status) {
    set({ viewerStatus: status });
  },
}));

export const imageViewerStoreApi = useImageViewerStore;
