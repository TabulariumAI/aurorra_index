import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ViewerState, ViewerStatus } from "@tabulariumai/aurora-lens";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { AddIndexSelection } from "../../addindex";
import { toPositivePage, toViewerError } from "../data/imageViewerData";
import { imageViewerStoreApi, useImageViewerStore } from "../store/imageViewerStore";
import type { LensApi, PageRequest } from "../type/imageViewer.types";

function toLensPage(page: number): number {
  return Math.max(0, toPositivePage(page) - 1);
}

function requestKey(request: PageRequest, requestVersion: number): string {
  const searchKey = request.metadataIndex
    ? `${request.metadataIndex.label}:${request.metadataIndex.value}:${request.metadataIndex.source}:${request.metadataIndex.ambiguous}`
    : `${request.value}:${request.quote}`;
  return `${request.session}:${requestVersion}:${request.page}:${request.code}:${request.index}:${request.segment}:${searchKey}:${request.highlightOptions.scroll}`;
}

async function syncLensRequest(lens: LensApi, request: PageRequest): Promise<void> {
  console.info("imageviewer lens sync request", {
    code: request.code,
    page: request.page,
    segment: request.segment,
    session: request.session,
  });
  await lens.goToPage(toLensPage(request.page));
  applySearch(lens, request);
}

function applySearch(lens: LensApi, request: PageRequest): void {
  if (request.metadataIndex) {
    console.info("imageviewer lens search index request", {
      page: request.page,
      session: request.session,
      sourceLength: request.metadataIndex.source.length,
      valueLength: request.metadataIndex.value.length,
    });
    lens.searchIndex(request.page, request.metadataIndex, { additive: false });
    return;
  }
  if (request.value) {
    console.info("imageviewer lens search request", {
      contextLength: request.quote.length,
      page: request.page,
      session: request.session,
      valueLength: request.value.length,
    });
    lens.search(request.value, { additive: false, context: request.quote || null });
  } else if (request.quote) {
    console.info("imageviewer lens search request", {
      contextLength: 0,
      page: request.page,
      session: request.session,
      valueLength: request.quote.length,
    });
    lens.search(request.quote, { additive: false, context: null });
  }
}

export function useImageViewer() {
  const lensHostRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<LensApi | null>(null);
  const decodingPackageKeyRef = useRef<string | null>(null);
  const decodedSessionRef = useRef<string | null>(null);
  const decodedPackageVersionRef = useRef(0);
  const fitPageRequestRef = useRef(0);
  const lastRequestKeyRef = useRef("");
  const retryPackageRef = useRef(0);
  const retryVersionRef = useRef(0);
  const [decodedVersion, setDecodedVersion] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [lensReady, setLensReady] = useState(false);
  const [reloadId, setReloadId] = useState(0);
  const [restoreDone, setRestoreDone] = useState(false);
  const [restoredSession, setRestoredSession] = useState(false);
  const packageVersion = useImageViewerStore((state) => state.packageVersion);
  const fitPageVersion = useImageViewerStore((state) => state.fitPageVersion);
  const request = useImageViewerStore((state) => state.request);
  const requestVersion = useImageViewerStore((state) => state.requestVersion);
  const session = useImageViewerStore((state) => state.session);
  const packageMetadata = useImageViewerStore((state) => state.packageMetadata);
  const searchText = useImageViewerStore((state) => state.searchText);
  const tiffBytes = useImageViewerStore((state) => state.tiffBytes);
  const tiffType = useImageViewerStore((state) => state.tiffType);
  const viewerState = useImageViewerStore((state) => state.viewerState);
  const viewerStatus = useImageViewerStore((state) => state.viewerStatus);
  const status = useImageViewerStore((state) => state.status);
  const pageReady = Boolean(loaded && viewerState?.status === "ready" && viewerState.pageIndex >= 0);
  const metadataReady = Boolean(pageReady && viewerState?.pageInfo);

  useLayoutEffect(() => {
    const lensHost = lensHostRef.current;
    if (!lensHost || !session) return undefined;
    const activeLensHost = lensHost;
    let canceled = false;
    let createdLens: LensApi | null = null;
    let activeLens: LensApi | null = null;

    async function createLens() {
      const { AuroraLens, IndexedDbViewerSessionStore, configurePdfWorker } = await import("@tabulariumai/aurora-lens");
      if (canceled) return;
      configurePdfWorker(pdfWorkerUrl);
      console.info("imageviewer lens create", { session });
      createdLens = new AuroraLens(activeLensHost, {
        allowEdit: false,
        selectionTheme: {
          intelligence: {
            fill: "rgba(0, 128, 128, 0.12)",
            stroke: "#008080",
          },
        },
        sessionStore: new IndexedDbViewerSessionStore(),
        onError: (error) => {
          if (canceled || lensRef.current !== activeLens) return;
          imageViewerStoreApi.getState().setError(toViewerError(error, "Image viewer failed."));
        },
        onStateChange: (state: ViewerState) => {
          if (canceled || lensRef.current !== activeLens) return;
          imageViewerStoreApi.getState().setViewerState(state);
        },
        onStatusChange: (status: ViewerStatus) => {
          if (canceled || lensRef.current !== activeLens) return;
          imageViewerStoreApi.getState().setViewerStatus(status);
        },
      }) as unknown as LensApi;
      activeLens = createdLens;
      lensRef.current = createdLens;
      setLensReady(true);
    }

    void createLens();
    return () => {
      console.info("imageviewer lens close", {
        decodedPackageVersion: decodedPackageVersionRef.current,
        decodedSession: decodedSessionRef.current,
        session,
      });
      canceled = true;
      createdLens?.close();
      imageViewerStoreApi.getState().resetLens();
      lensRef.current = null;
      setLoaded(false);
      setLensReady(false);
      setRestoreDone(false);
      setRestoredSession(false);
      decodingPackageKeyRef.current = null;
      decodedSessionRef.current = null;
      decodedPackageVersionRef.current = 0;
      fitPageRequestRef.current = 0;
      retryPackageRef.current = 0;
      retryVersionRef.current = 0;
      setDecodedVersion(0);
      setReloadId(0);
    };
  }, [session]);

  useEffect(() => {
    const lens = lensRef.current;
    if (!lensReady || !lens || !session) return;
    const activeLens = lens;
    const activeSession = session;
    let canceled = false;

    async function restorePackage() {
      try {
        console.info("imageviewer lens restore start", { session: activeSession });
        const restored = await activeLens.restoreSession();
        console.info("imageviewer lens restore done", { restored, session: activeSession });
        if (canceled || lensRef.current !== activeLens) return;
        const state = imageViewerStoreApi.getState();
        const hasLocalPackage = Boolean(state.packageMetadata && state.tiffBytes && state.tiffType !== null);
        if (restored && !hasLocalPackage) {
          setLoaded(true);
          setRestoredSession(true);
          state.setReady();
        }
      } finally {
        if (!canceled && lensRef.current === activeLens) setRestoreDone(true);
      }
    }

    void restorePackage();
    return () => {
      canceled = true;
    };
  }, [lensReady, session]);

  useEffect(() => {
    const lens = lensRef.current;
    if (!restoreDone || !lensReady || !lens || !request || !packageMetadata || !tiffBytes || tiffType === null) return;
    if (decodedSessionRef.current === request.session && decodedPackageVersionRef.current === packageVersion) return;
    const packageKey = `${request.session}:${packageVersion}`;
    if (decodingPackageKeyRef.current === packageKey) return;
    const activeLens = lens;
    const activeRequest = request;
    const activePackageMetadata = packageMetadata;
    const activePackageVersion = packageVersion;
    const activeTiffBytes = tiffBytes;
    const activeTiffType = tiffType;
    let canceled = false;

    async function decodePackage() {
      decodingPackageKeyRef.current = packageKey;
      try {
        setLoaded(false);
        activeLens.clear();
        console.info("imageviewer lens metadata load", {
          metadataPages: activePackageMetadata.pages.length,
          packageVersion: activePackageVersion,
          session: activeRequest.session,
        });
        activeLens.loadMetadata(activePackageMetadata);
        const file = new File([activeTiffBytes], "document-image-package.tiff", { type: activeTiffType });
        console.info("imageviewer lens decode start", {
          page: activeRequest.page,
          packageVersion: activePackageVersion,
          previousDecodedPackageVersion: decodedPackageVersionRef.current,
          previousDecodedSession: decodedSessionRef.current,
          session: activeRequest.session,
          tiffBytes: activeTiffBytes.byteLength,
          tiffType: activeTiffType,
        });
        await activeLens.decodeDoc(file, { page: toLensPage(activeRequest.page), viewMode: "page" });
        const state = imageViewerStoreApi.getState();
        if (canceled || lensRef.current !== activeLens || state.session !== activeRequest.session || state.packageVersion !== activePackageVersion) return;
        applySearch(activeLens, activeRequest);
        decodedSessionRef.current = activeRequest.session;
        decodedPackageVersionRef.current = activePackageVersion;
        lastRequestKeyRef.current = requestKey(activeRequest, requestVersion);
        setDecodedVersion(activePackageVersion);
        setLoaded(true);
        console.info("imageviewer lens ready", {
          page: activeRequest.page,
          packageVersion: activePackageVersion,
          session: activeRequest.session,
        });
        imageViewerStoreApi.getState().setReady();
      } catch (error) {
        console.info("imageviewer lens error", {
          packageVersion: activePackageVersion,
          session: activeRequest.session,
        });
        if (!canceled && lensRef.current === activeLens) {
          imageViewerStoreApi.getState().setError(toViewerError(error, "Image package failed to load."));
        }
      } finally {
        if (decodingPackageKeyRef.current === packageKey) {
          decodingPackageKeyRef.current = null;
        }
      }
    }

    void decodePackage();
    return () => {
      canceled = true;
    };
  }, [lensReady, packageMetadata, packageVersion, request, requestVersion, restoreDone, tiffBytes, tiffType]);

  useEffect(() => {
    if (
      !pageReady ||
      status !== "ready" ||
      !request ||
      requestVersion === 0 ||
      viewerState?.pageIndex !== toLensPage(request.page) ||
      viewerState.pageInfo
    ) return;
    if (retryVersionRef.current !== requestVersion) {
      retryVersionRef.current = requestVersion;
      retryPackageRef.current = decodedVersion;
      console.info("imageviewer lens package reload requested", {
        decodedVersion,
        packageVersion,
        page: request.page,
        requestVersion,
        session: request.session,
        viewerPageIndex: viewerState.pageIndex,
      });
      setReloadId(requestVersion);
      return;
    }
    if (decodedVersion > retryPackageRef.current) {
      imageViewerStoreApi.getState().setError({
        code: "image_metadata_unavailable",
        error: "Image package metadata is unavailable for this page.",
      });
    }
  }, [decodedVersion, pageReady, request, requestVersion, status, viewerState]);

  useEffect(() => {
    const lens = lensRef.current;
    if (!lens || !pageReady || !request) return;
    const key = requestKey(request, requestVersion);
    if (lastRequestKeyRef.current === key) return;
    lastRequestKeyRef.current = key;
    const activeLens = lens;
    const activeRequest = request;
    let canceled = false;

    async function syncRequest() {
      await syncLensRequest(activeLens, activeRequest);
      if (canceled) return;
    }

    void syncRequest();
    return () => {
      canceled = true;
    };
  }, [pageReady, request, requestVersion]);

  useEffect(() => {
    const lens = lensRef.current;
    if (!lens || !pageReady || !viewerState?.canFitPage || fitPageVersion === 0 || fitPageRequestRef.current === fitPageVersion) return;
    fitPageRequestRef.current = fitPageVersion;
    console.info("imageviewer lens action", { action: "fitPage" });
    lens.fitPage();
  }, [fitPageVersion, pageReady, viewerState?.canFitPage]);

  const previousPage = useCallback(() => {
    if (!pageReady || !viewerState?.canGoPrevious) return;
    console.info("imageviewer lens action", { action: "previousPage" });
    void lensRef.current?.previousPage();
  }, [pageReady, viewerState?.canGoPrevious]);

  const nextPage = useCallback(() => {
    if (!pageReady || !viewerState?.canGoNext) return;
    console.info("imageviewer lens action", { action: "nextPage" });
    void lensRef.current?.nextPage();
  }, [pageReady, viewerState?.canGoNext]);

  const firstPage = useCallback(() => {
    if (!pageReady || !viewerState?.canGoFirst) return;
    console.info("imageviewer lens action", { action: "firstPage" });
    void lensRef.current?.firstPage();
  }, [pageReady, viewerState?.canGoFirst]);

  const lastPage = useCallback(() => {
    if (!pageReady || !viewerState?.canGoLast) return;
    console.info("imageviewer lens action", { action: "lastPage" });
    void lensRef.current?.lastPage();
  }, [pageReady, viewerState?.canGoLast]);

  const search = useCallback(() => {
    if (!metadataReady || !searchText.trim() || !viewerState?.canSearch) return;
    console.info("imageviewer lens action", { action: "search", length: searchText.length });
    lensRef.current?.search(searchText, { additive: false, context: null });
  }, [metadataReady, searchText, viewerState?.canSearch]);

  const clearSearch = useCallback(() => {
    console.info("imageviewer lens action", { action: "clearSearch" });
    imageViewerStoreApi.getState().setSearchText("");
    if (!pageReady || !viewerState?.canClearSelection) return;
    lensRef.current?.clearSelection();
  }, [pageReady, viewerState?.canClearSelection]);

  const exportSelection = useCallback(async (): Promise<AddIndexSelection | null> => {
    if (!pageReady || !viewerState?.canCopy) return null;
    console.info("imageviewer lens action", { action: "exportSelection" });
    try {
      const result = await lensRef.current?.copySelection();
      const pageInfo = lensRef.current?.readPageInfo();
      if (!result?.copied || !pageInfo) return null;
      return { groups: result.groups, pageNumber: pageInfo.pageNumber };
    } catch (error) {
      imageViewerStoreApi.getState().setError(toViewerError(error, "Could not export selected values."));
      return null;
    }
  }, [pageReady, viewerState?.canCopy]);

  const select = useCallback(() => {
    if (!metadataReady || !viewerState?.canDraw) return;
    console.info("imageviewer lens action", { action: "select", enabled: !viewerState.drawMode });
    lensRef.current?.setDrawMode(!viewerState.drawMode);
  }, [metadataReady, viewerState?.canDraw, viewerState?.drawMode]);

  const showThumbnails = useCallback(() => {
    if (!pageReady || !viewerState?.canShowThumbnails) return;
    console.info("imageviewer lens action", { action: "showThumbnails" });
    imageViewerStoreApi.getState().setThumbsOpen(true);
    void lensRef.current?.showThumbnails();
  }, [pageReady, viewerState?.canShowThumbnails]);

  const zoomIn = useCallback(() => {
    if (!pageReady || !viewerState?.canZoomIn) return;
    console.info("imageviewer lens action", { action: "zoomIn" });
    lensRef.current?.zoomIn();
  }, [pageReady, viewerState?.canZoomIn]);

  const zoomOut = useCallback(() => {
    if (!pageReady || !viewerState?.canZoomOut) return;
    console.info("imageviewer lens action", { action: "zoomOut" });
    lensRef.current?.zoomOut();
  }, [pageReady, viewerState?.canZoomOut]);

  const fitWidth = useCallback(() => {
    if (!pageReady || !viewerState?.canFitWidth) return;
    console.info("imageviewer lens action", { action: "fitWidth" });
    lensRef.current?.fitWidth();
  }, [pageReady, viewerState?.canFitWidth]);

  const fitHeight = useCallback(() => {
    if (!pageReady || !viewerState?.canFitHeight) return;
    console.info("imageviewer lens action", { action: "fitHeight" });
    lensRef.current?.fitHeight();
  }, [pageReady, viewerState?.canFitHeight]);

  const fitPage = useCallback(() => {
    if (!pageReady || !viewerState?.canFitPage) return;
    console.info("imageviewer lens action", { action: "fitPage" });
    lensRef.current?.fitPage();
  }, [pageReady, viewerState?.canFitPage]);

  const actualSize = useCallback(() => {
    if (!pageReady || !viewerState?.canActualSize) return;
    console.info("imageviewer lens action", { action: "actualSize" });
    lensRef.current?.actualSize();
  }, [pageReady, viewerState?.canActualSize]);

  return {
    actualSize,
    canActualSize: Boolean(pageReady && viewerState?.canActualSize),
    canClearSearch: Boolean(searchText || (pageReady && viewerState?.canClearSelection)),
    canExport: Boolean(pageReady && viewerState?.canCopy),
    canFitHeight: Boolean(pageReady && viewerState?.canFitHeight),
    canFitPage: Boolean(pageReady && viewerState?.canFitPage),
    canFitWidth: Boolean(pageReady && viewerState?.canFitWidth),
    canGoFirst: Boolean(pageReady && viewerState?.canGoFirst),
    canGoLast: Boolean(pageReady && viewerState?.canGoLast),
    canGoNext: Boolean(pageReady && viewerState?.canGoNext),
    canGoPrevious: Boolean(pageReady && viewerState?.canGoPrevious),
    canSearch: Boolean(metadataReady && viewerState?.canSearch),
    canSelect: Boolean(metadataReady && viewerState?.canDraw),
    canShowThumbnails: Boolean(pageReady && viewerState?.canShowThumbnails),
    canZoomIn: Boolean(pageReady && viewerState?.canZoomIn),
    canZoomOut: Boolean(pageReady && viewerState?.canZoomOut),
    clearSearch,
    exportSelection,
    firstPage,
    fitHeight,
    fitPage,
    fitWidth,
    isLoading: Boolean(!pageReady && viewerState?.status !== "copyingSelection" && request && packageMetadata && tiffBytes && tiffType !== null),
    isNavigating: loaded && (viewerStatus === "loadingPage" || viewerState?.status === "loadingPage"),
    isRestoredSession: restoredSession,
    isRestoring: Boolean(session && (!lensReady || !restoreDone)),
    isThumbs: viewerState?.viewMode === "thumbnails",
    lastPage,
    lensHostRef,
    nextPage,
    page: viewerState && viewerState.pageIndex >= 0 ? viewerState.pageIndex + 1 : 0,
    pageCount: viewerState?.pageCount ?? 0,
    previousPage,
    reloadId,
    search,
    selecting: Boolean(viewerState?.drawMode),
    select,
    showThumbnails,
    zoom: viewerState?.zoom,
    zoomIn,
    zoomOut,
  };
}
