import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PageMetadataHits, PageSizeConfig, PageSizeFailure, ViewerState, ViewerStatus } from "@tabulariumai/aurora-lens";
import type { AddIndexSelection } from "../../addindex";
import { isPageError, toViewerError } from "../data/imageViewerData";
import { imageViewerStoreApi, useImageViewerStore } from "../store/imageViewerStore";
import type { LensApi, PageRequest } from "../type/imageViewer.types";

function requestKey(request: PageRequest, requestVersion: number): string {
  const contentKey = request.metadataIndex
    ? `${request.metadataIndex.label}:${request.metadataIndex.value}:${request.metadataIndex.source}:${request.metadataIndex.ambiguous}`
    : `${request.value}:${request.quote}`;
  return `${request.session}:${requestVersion}:${request.page}:${request.code}:${request.index}:${request.segment}:${contentKey}:${request.highlightOptions.scroll}`;
}

function applyRequest(lens: LensApi, request: PageRequest): boolean | PageMetadataHits | null {
  if (request.metadataIndex) {
    console.info("imageviewer lens highlight index request", {
      page: request.page,
      session: request.session,
      sourceLength: request.metadataIndex.source.length,
      valueLength: request.metadataIndex.value.length,
    });
    return lens.highlightIndex(request.page, request.metadataIndex, { additive: false });
  }
  if (request.value) {
    console.info("imageviewer lens search request", {
      contextLength: request.quote.length,
      page: request.page,
      session: request.session,
      valueLength: request.value.length,
    });
    return lens.search(request.value, { additive: false, context: request.quote || null });
  } else if (request.quote) {
    console.info("imageviewer lens search request", {
      contextLength: 0,
      page: request.page,
      session: request.session,
      valueLength: request.quote.length,
    });
    return lens.search(request.quote, { additive: false, context: null });
  }
  lens.clearSelection();
  return null;
}

export function useImageViewer() {
  const pageSize = useImageViewerStore(state => state.pageSize);
  const [sizeOverride, setSizeOverride] = useState<{ session: string; base: PageSizeConfig; config: PageSizeConfig } | null>(null);
  const [sizeFailure, setSizeFailure] = useState<PageSizeFailure | null>(null);
  const [sizeBlocked, setSizeBlocked] = useState(false);
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
  const [noMatch, setNoMatch] = useState<string | null>(null);
  const [lensReady, setLensReady] = useState(false);
  const [reloadId, setReloadId] = useState(0);
  const [restoreDone, setRestoreDone] = useState(false);
  const [restoredSession, setRestoredSession] = useState(false);
  const packageVersion = useImageViewerStore((state) => state.packageVersion);
  const fitPageVersion = useImageViewerStore((state) => state.fitPageVersion);
  const request = useImageViewerStore((state) => state.request);
  const error = useImageViewerStore((state) => state.error);
  const requestVersion = useImageViewerStore((state) => state.requestVersion);
  const session = useImageViewerStore((state) => state.session);
  const packageMetadata = useImageViewerStore((state) => state.packageMetadata);
  const searchText = useImageViewerStore((state) => state.searchText);
  const tiffBytes = useImageViewerStore((state) => state.tiffBytes);
  const tiffType = useImageViewerStore((state) => state.tiffType);
  const viewerState = useImageViewerStore((state) => state.viewerState);
  const viewerStatus = useImageViewerStore((state) => state.viewerStatus);
  const status = useImageViewerStore((state) => state.status);
  const lensSize = sizeOverride?.session === session && sizeOverride.base === pageSize ? sizeOverride.config : pageSize;
  const reportFailure = useCallback((error: unknown, message: string) => {
    const failure = toViewerError(error, message);
    if (failure.code === "page_size" && failure.details) {
      setSizeFailure(failure.details as PageSizeFailure);
      setSizeBlocked(true);
      setLoaded(false);
      imageViewerStoreApi.getState().setViewerStatus("idle");
      return;
    }
    imageViewerStoreApi.getState().setError(failure);
  }, []);
  const acceptSize = useCallback(() => {
    if (!sizeFailure || !pageSize || !session || imageViewerStoreApi.getState().session !== session) return;
    setSizeOverride({ session, base: pageSize, config: { ...pageSize, tolerance: sizeFailure.requiredTolerance } });
  }, [pageSize, session, sizeFailure]);
  const cancelSize = useCallback(() => {
    setSizeFailure(null);
  }, []);
  const resolution = useMemo(() => {
    if (!request || request.session !== session || !loaded || !lensRef.current) return { page: null, error: null };
    try {
      return { page: lensRef.current.resolvePage(request.page), error: null };
    } catch (error) {
      return { page: null, error: toViewerError(error, "Document page is unavailable.") };
    }
  }, [loaded, request, session, viewerState?.pageCount]);
  const imagePage = resolution.page;
  const pageReady = Boolean(!resolution.error && loaded && viewerState?.status === "ready" && viewerState.pageIndex >= 0);
  const metadataReady = Boolean(pageReady && viewerState?.pageInfo);

  useEffect(() => {
    const state = imageViewerStoreApi.getState();
    if (state.request !== request || state.packageMetadata !== packageMetadata || state.session !== session) return;
    if (resolution.error) {
      lastRequestKeyRef.current = "";
      if (error !== resolution.error) state.setError(resolution.error);
    }
  }, [error, packageMetadata, request, resolution, session]);

  useLayoutEffect(() => {
    setSizeOverride(null);
  }, [pageSize, session]);

  useLayoutEffect(() => {
    const lensHost = lensHostRef.current;
    if (!lensHost || !session || !lensSize) return undefined;
    setSizeFailure(null);
    setSizeBlocked(false);
    const activeLensHost = lensHost;
    const sessionId = session;
    let canceled = false;
    let createdLens: LensApi | null = null;
    let activeLens: LensApi | null = null;

    async function createLens(pageSize: PageSizeConfig) {
      const { AuroraLens, IndexedDbViewerSessionStore } = await import("@tabulariumai/aurora-lens");
      if (canceled) return;
      console.info("imageviewer lens create", { session });
      createdLens = new AuroraLens(activeLensHost, {
        pageSize,
        allowEdit: false,
        selectionTheme: {
          intelligence: {
            fill: "rgba(0, 128, 128, 0.12)",
            stroke: "#008080",
          },
        },
        sessionStore: new IndexedDbViewerSessionStore(),
        sessionId,
        onError: (error) => {
          if (canceled || lensRef.current !== activeLens) return;
          reportFailure(error, "Image viewer failed.");
        },
        onStateChange: (state: ViewerState) => {
          if (canceled || lensRef.current !== activeLens) return;
          imageViewerStoreApi.getState().setViewerState(state);
        },
        onStatusChange: (status: ViewerStatus) => {
          if (canceled || lensRef.current !== activeLens) return;
          imageViewerStoreApi.getState().setViewerStatus(status);
        },
      });
      activeLens = createdLens;
      lensRef.current = createdLens;
      setLensReady(true);
    }

    void createLens(lensSize).catch(error => {
      if (!canceled) reportFailure(error, "Image viewer could not be initialized.");
    });
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
      lastRequestKeyRef.current = "";
      retryPackageRef.current = 0;
      retryVersionRef.current = 0;
      setDecodedVersion(0);
      setReloadId(0);
    };
  }, [lensSize, reportFailure, session]);

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
      } catch (error) {
        if (!canceled && lensRef.current === activeLens) reportFailure(error, "Image session could not be restored.");
      } finally {
        if (!canceled && lensRef.current === activeLens) setRestoreDone(true);
      }
    }

    void restorePackage();
    return () => {
      canceled = true;
    };
  }, [lensReady, reportFailure, session]);

  useEffect(() => {
    const lens = lensRef.current;
    const request = imageViewerStoreApi.getState().request;
    if (sizeBlocked || !restoreDone || !lensReady || !lens || !request || !packageMetadata || !tiffBytes || tiffType === null) return;
    if (decodedSessionRef.current === request.session && decodedPackageVersionRef.current === packageVersion) return;
    const packageKey = `${request.session}:${packageVersion}`;
    if (decodingPackageKeyRef.current === packageKey) return;
    const activeLens = lens;
    const activeRequest = request;
    const activePackageMetadata = packageMetadata;
    const activePackageVersion = packageVersion;
    const activeTiffBytes = tiffBytes;
    const activeTiffType = tiffType;

    async function decodePackage() {
      decodingPackageKeyRef.current = packageKey;
      try {
        setLoaded(false);
        lastRequestKeyRef.current = "";
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
        await activeLens.decodeDoc(file, { page: activeRequest.page, viewMode: "page" });
        const state = imageViewerStoreApi.getState();
        if (lensRef.current !== activeLens || state.session !== activeRequest.session || state.packageVersion !== activePackageVersion) return;
        decodedSessionRef.current = activeRequest.session;
        decodedPackageVersionRef.current = activePackageVersion;
        setDecodedVersion(activePackageVersion);
        setLoaded(true);
        console.info("imageviewer lens ready", {
          page: activeRequest.page,
          packageVersion: activePackageVersion,
          session: activeRequest.session,
        });
        if (!isPageError(state.error)) state.setReady();
      } catch (error) {
        console.info("imageviewer lens error", {
          packageVersion: activePackageVersion,
          session: activeRequest.session,
        });
        const state = imageViewerStoreApi.getState();
        if (lensRef.current === activeLens && state.session === activeRequest.session && state.packageVersion === activePackageVersion) {
          reportFailure(error, "Image package failed to load.");
        }
      } finally {
        if (decodingPackageKeyRef.current === packageKey) {
          decodingPackageKeyRef.current = null;
        }
      }
    }

    void decodePackage();
  }, [lensReady, packageMetadata, packageVersion, reportFailure, request, restoreDone, sizeBlocked, tiffBytes, tiffType]);

  useEffect(() => {
    if (
      !pageReady ||
      status !== "ready" ||
      !request ||
      imagePage === null ||
      requestVersion === 0 ||
      viewerState?.pageIndex !== imagePage ||
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
  }, [decodedVersion, imagePage, pageReady, request, requestVersion, status, viewerState]);

  useEffect(() => {
    const lens = lensRef.current;
    if (!lens || !pageReady || !request || imagePage === null || decodingPackageKeyRef.current) return;
    const key = `${requestKey(request, requestVersion)}:${imagePage}`;
    if (lastRequestKeyRef.current === key) return;
    if (viewerState?.viewMode !== "page" || viewerState.pageIndex !== imagePage) {
      console.info("imageviewer lens sync request", {
        code: request.code,
        page: request.page,
        segment: request.segment,
        session: request.session,
      });
      // Lens reports navigation failures through its onError callback.
      void lens.goToPage(request.page).catch(() => undefined);
      return;
    }
    lastRequestKeyRef.current = key;
    if (isPageError(imageViewerStoreApi.getState().error)) imageViewerStoreApi.getState().setReady();
    const result = applyRequest(lens, request);
    setNoMatch(request.metadataIndex && result === false ? key : null);
  }, [imagePage, pageReady, request, requestVersion, viewerState?.pageIndex, viewerState?.viewMode]);

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
    void lensRef.current?.previousPage().catch(() => undefined);
  }, [pageReady, viewerState?.canGoPrevious]);

  const nextPage = useCallback(() => {
    if (!pageReady || !viewerState?.canGoNext) return;
    console.info("imageviewer lens action", { action: "nextPage" });
    void lensRef.current?.nextPage().catch(() => undefined);
  }, [pageReady, viewerState?.canGoNext]);

  const firstPage = useCallback(() => {
    if (!pageReady || !viewerState?.canGoFirst) return;
    console.info("imageviewer lens action", { action: "firstPage" });
    void lensRef.current?.firstPage().catch(() => undefined);
  }, [pageReady, viewerState?.canGoFirst]);

  const lastPage = useCallback(() => {
    if (!pageReady || !viewerState?.canGoLast) return;
    console.info("imageviewer lens action", { action: "lastPage" });
    void lensRef.current?.lastPage().catch(() => undefined);
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
      const groups = lensRef.current?.exportSelection();
      if (!groups?.length) return null;
      const pageName = lensRef.current?.readPageName();
      if (!pageName) throw new Error("Document page name is unavailable.");
      return { groups, pageName };
    } catch (error) {
      imageViewerStoreApi.getState().setError(toViewerError(error, "Could not export selected values."));
      return null;
    }
  }, [pageReady, viewerState?.canCopy]);

  const copySelection = useCallback(async (): Promise<void> => {
    if (!pageReady || !viewerState?.canCopy) return;
    console.info("imageviewer lens action", { action: "copySelection" });
    try {
      await lensRef.current?.copySelection();
    } catch (error) {
      imageViewerStoreApi.getState().setError(toViewerError(error, "Could not copy selected values."));
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
    void lensRef.current?.showThumbnails().catch(() => undefined);
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
    acceptSize,
    cancelSize,
    sizeFailure,
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
    copySelection,
    firstPage,
    fitHeight,
    fitPage,
    fitWidth,
    isLoading: Boolean(!sizeBlocked && !resolution.error && !pageReady && viewerState?.status !== "copyingSelection" && request && packageMetadata && tiffBytes && tiffType !== null),
    hasRequestError: Boolean(sizeBlocked || resolution.error),
    isNavigating: !sizeBlocked && loaded && (viewerStatus === "loadingPage" || viewerState?.status === "loadingPage"),
    isRestoredSession: restoredSession,
    isRestoring: Boolean(session && (!lensReady || !restoreDone)),
    isThumbs: viewerState?.viewMode === "thumbnails",
    lastPage,
    lensHostRef,
    nextPage,
    noMatch: Boolean(noMatch && request && request.session === session && pageReady && noMatch === `${requestKey(request, requestVersion)}:${imagePage}`),
    setNoMatch,
    page: viewerState && viewerState.pageIndex >= 0 ? viewerState.pageIndex + 1 : 0,
    pageName: viewerState?.pageName,
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
