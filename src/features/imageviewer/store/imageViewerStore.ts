import { create } from "zustand";
import type { StoreState } from "../type/imageViewer.types";
import { isPageError } from "../data/imageViewerData";

export const useImageViewerStore = create<StoreState>()((set, get) => ({
  pageSize: null,
  apiGatewayUrl: "",
  authToken: null,
  error: null,
  fitPageVersion: 0,
  onError: null,
  pageMap: new Map(),
  packageMetadata: null,
  packageStatus: null,
  packageVersion: 0,
  request: null,
  requestVersion: 0,
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
      fitPageVersion: 0,
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
      pageSize: null,
      apiGatewayUrl: "",
      authToken: null,
      error: null,
      fitPageVersion: 0,
      onError: null,
      pageMap: new Map(),
      packageMetadata: null,
      packageStatus: null,
      packageVersion: 0,
      request: null,
      requestVersion: 0,
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
  fitPage() {
    set({ fitPageVersion: get().fitPageVersion + 1 });
  },
  setHostInput(input) {
    const current = get();
    const sameSession = current.session === input.session;
    set({
      pageSize: input.pageSize,
      apiGatewayUrl: input.apiGatewayUrl,
      authToken: input.authToken,
      error: sameSession && isPageError(current.error) ? current.error : null,
      fitPageVersion: sameSession ? current.fitPageVersion : 0,
      onError: input.onError,
      pageMap: new Map(input.pageMap),
      packageMetadata: sameSession ? current.packageMetadata : null,
      packageStatus: sameSession ? current.packageStatus : null,
      packageVersion: sameSession ? current.packageVersion : 0,
      request: input.request,
      requestVersion: sameSession ? current.requestVersion : 0,
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
    set({ request, requestVersion: get().requestVersion + 1 });
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
