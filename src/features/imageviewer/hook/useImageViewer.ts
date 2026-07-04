import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ViewerState, ViewerStatus } from "@tabulariumai/aurora-lens";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { toPositivePage, toViewerError } from "../data/imageViewerData";
import { imageViewerStoreApi, useImageViewerStore } from "../store/imageViewerStore";
import { ImageViewerSessionStore } from "../store/imageViewerSessionStore";
import type { LensApi, PageRequest } from "../type/imageViewer.types";

function toLensPage(page: number): number {
  return Math.max(0, toPositivePage(page) - 1);
}

function requestKey(request: PageRequest): string {
  return `${request.session}:${request.page}:${request.code}:${request.index}:${request.segment}:${request.value}:${request.quote}:${request.highlightOptions.scroll}`;
}

async function syncLensRequest(lens: LensApi, request: PageRequest): Promise<void> {
  await lens.goToPage(toLensPage(request.page));
  applySearch(lens, request);
}

function applySearch(lens: LensApi, request: PageRequest): void {
  if (request.value) {
    lens.search(request.value, { additive: false, context: request.quote || null });
  } else if (request.quote) {
    lens.search(request.quote, { additive: false, context: null });
  }
}

export function useImageViewer() {
  const lensHostRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<LensApi | null>(null);
  const decodedSessionRef = useRef<string | null>(null);
  const lastRequestKeyRef = useRef("");
  const [loaded, setLoaded] = useState(false);
  const [lensReady, setLensReady] = useState(false);
  const lensSession = useImageViewerStore((state) => state.lensSession);
  const packageVersion = useImageViewerStore((state) => state.packageVersion);
  const request = useImageViewerStore((state) => state.request);
  const session = useImageViewerStore((state) => state.session);
  const packageMetadata = useImageViewerStore((state) => state.packageMetadata);
  const searchText = useImageViewerStore((state) => state.searchText);
  const tiffBytes = useImageViewerStore((state) => state.tiffBytes);
  const tiffType = useImageViewerStore((state) => state.tiffType);
  const viewerState = useImageViewerStore((state) => state.viewerState);

  useLayoutEffect(() => {
    const lensHost = lensHostRef.current;
    if (!lensHost || !session || packageVersion === 0) return undefined;
    const activeLensHost = lensHost;
    let canceled = false;
    let createdLens: LensApi | null = null;

    async function createLens() {
      const { AuroraLens, configurePdfWorker } = await import("@tabulariumai/aurora-lens");
      if (canceled) return;
      configurePdfWorker(pdfWorkerUrl);
      createdLens = new AuroraLens(activeLensHost, {
        allowEdit: false,
        selectionTheme: {
          intelligence: {
            fill: "rgba(0, 128, 128, 0.12)",
            stroke: "#008080",
          },
        },
        sessionStore: new ImageViewerSessionStore(`${session}:${packageVersion}`),
        onError: (error) => {
          imageViewerStoreApi.getState().setError(toViewerError(error, "Image viewer failed."));
        },
        onStateChange: (state: ViewerState) => {
          imageViewerStoreApi.getState().setViewerState(state);
        },
        onStatusChange: (status: ViewerStatus) => {
          imageViewerStoreApi.getState().setViewerStatus(status);
        },
      }) as unknown as LensApi;
      lensRef.current = createdLens;
      setLensReady(true);
    }

    void createLens();
    return () => {
      canceled = true;
      createdLens?.close();
      imageViewerStoreApi.getState().resetLens();
      lensRef.current = null;
      setLoaded(false);
      setLensReady(false);
      decodedSessionRef.current = null;
    };
  }, [packageVersion, session]);

  useEffect(() => {
    const lens = lensRef.current;
    if (!lensReady || !lens || !request || !packageMetadata || !tiffBytes || tiffType === null) return;
    if (decodedSessionRef.current === request.session) return;
    const activeLens = lens;
    const activeRequest = request;
    const activeLensSession = lensSession;
    const activePackageMetadata = packageMetadata;
    const activeTiffBytes = tiffBytes;
    const activeTiffType = tiffType;
    let canceled = false;

    async function decodePackage() {
      try {
        setLoaded(false);
        if (activeLensSession === activeRequest.session) {
          const restored = await activeLens.restoreSession();
          if (canceled) return;
          if (restored) {
            activeLens.loadMetadata(activePackageMetadata);
            await syncLensRequest(activeLens, activeRequest);
            if (canceled) return;
            decodedSessionRef.current = activeRequest.session;
            lastRequestKeyRef.current = requestKey(activeRequest);
            setLoaded(true);
            imageViewerStoreApi.getState().setLensSession(activeRequest.session);
            imageViewerStoreApi.getState().setReady();
            return;
          }
        }

        activeLens.clear();
        activeLens.loadMetadata(activePackageMetadata);
        const file = new File([activeTiffBytes], "document-image-package.tiff", { type: activeTiffType });
        if (canceled) return;
        await activeLens.decodeDoc(file, { page: toLensPage(activeRequest.page), viewMode: "page" });
        if (canceled) return;
        applySearch(activeLens, activeRequest);
        decodedSessionRef.current = activeRequest.session;
        lastRequestKeyRef.current = requestKey(activeRequest);
        setLoaded(true);
        imageViewerStoreApi.getState().setLensSession(activeRequest.session);
        imageViewerStoreApi.getState().setReady();
      } catch (error) {
        if (!canceled) imageViewerStoreApi.getState().setError(toViewerError(error, "Image package failed to load."));
      }
    }

    void decodePackage();
    return () => {
      canceled = true;
    };
  }, [lensReady, lensSession, packageMetadata, request, tiffBytes, tiffType]);

  useEffect(() => {
    const lens = lensRef.current;
    if (!lens || !loaded || !request) return;
    const key = requestKey(request);
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
  }, [loaded, request]);

  const previousPage = useCallback(() => {
    if (!loaded || !viewerState?.canGoPrevious) return;
    void lensRef.current?.previousPage();
  }, [loaded, viewerState?.canGoPrevious]);

  const nextPage = useCallback(() => {
    if (!loaded || !viewerState?.canGoNext) return;
    void lensRef.current?.nextPage();
  }, [loaded, viewerState?.canGoNext]);

  const firstPage = useCallback(() => {
    if (!loaded || !viewerState?.canGoFirst) return;
    void lensRef.current?.firstPage();
  }, [loaded, viewerState?.canGoFirst]);

  const lastPage = useCallback(() => {
    if (!loaded || !viewerState?.canGoLast) return;
    void lensRef.current?.lastPage();
  }, [loaded, viewerState?.canGoLast]);

  const search = useCallback(() => {
    if (!searchText.trim()) return;
    lensRef.current?.search(searchText, { additive: false, context: null });
  }, [searchText]);

  const clearSearch = useCallback(() => {
    imageViewerStoreApi.getState().setSearchText("");
    if (!loaded || !viewerState?.canClearSelection) return;
    lensRef.current?.clearSelection();
  }, [loaded, viewerState?.canClearSelection]);

  const showThumbnails = useCallback(() => {
    if (!loaded || !viewerState?.canShowThumbnails) return;
    imageViewerStoreApi.getState().setThumbsOpen(true);
    void lensRef.current?.showThumbnails();
  }, [loaded, viewerState?.canShowThumbnails]);

  const zoomIn = useCallback(() => {
    if (!loaded || !viewerState?.canZoomIn) return;
    lensRef.current?.zoomIn();
  }, [loaded, viewerState?.canZoomIn]);

  const zoomOut = useCallback(() => {
    if (!loaded || !viewerState?.canZoomOut) return;
    lensRef.current?.zoomOut();
  }, [loaded, viewerState?.canZoomOut]);

  const fitWidth = useCallback(() => {
    if (!loaded || !viewerState?.canFitWidth) return;
    lensRef.current?.fitWidth();
  }, [loaded, viewerState?.canFitWidth]);

  const fitHeight = useCallback(() => {
    if (!loaded || !viewerState?.canFitHeight) return;
    lensRef.current?.fitHeight();
  }, [loaded, viewerState?.canFitHeight]);

  const fitPage = useCallback(() => {
    if (!loaded || !viewerState?.canFitPage) return;
    lensRef.current?.fitPage();
  }, [loaded, viewerState?.canFitPage]);

  const actualSize = useCallback(() => {
    if (!loaded || !viewerState?.canActualSize) return;
    lensRef.current?.actualSize();
  }, [loaded, viewerState?.canActualSize]);

  return {
    actualSize,
    canActualSize: Boolean(loaded && viewerState?.canActualSize),
    canClearSearch: Boolean(searchText || (loaded && viewerState?.canClearSelection)),
    canFitHeight: Boolean(loaded && viewerState?.canFitHeight),
    canFitPage: Boolean(loaded && viewerState?.canFitPage),
    canFitWidth: Boolean(loaded && viewerState?.canFitWidth),
    canGoFirst: Boolean(loaded && viewerState?.canGoFirst),
    canGoLast: Boolean(loaded && viewerState?.canGoLast),
    canGoNext: Boolean(loaded && viewerState?.canGoNext),
    canGoPrevious: Boolean(loaded && viewerState?.canGoPrevious),
    canSearch: Boolean(viewerState?.canSearch),
    canShowThumbnails: Boolean(loaded && viewerState?.canShowThumbnails),
    canZoomIn: Boolean(loaded && viewerState?.canZoomIn),
    canZoomOut: Boolean(loaded && viewerState?.canZoomOut),
    clearSearch,
    firstPage,
    fitHeight,
    fitPage,
    fitWidth,
    isLoading: Boolean(!loaded && request && packageMetadata && tiffBytes && tiffType !== null),
    isThumbs: viewerState?.viewMode === "thumbnails",
    lastPage,
    lensHostRef,
    nextPage,
    page: viewerState && viewerState.pageIndex >= 0 ? viewerState.pageIndex + 1 : 0,
    pageCount: viewerState?.pageCount ?? 0,
    previousPage,
    search,
    showThumbnails,
    zoomIn,
    zoomOut,
  };
}
