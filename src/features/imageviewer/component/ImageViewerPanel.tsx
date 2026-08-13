import { useEffect, useLayoutEffect, useRef } from "react";
import type { JSX } from "react";
import { addIndexStoreApi } from "../../addindex";
import { loadImagePackage } from "../data/loadImagePackage";
import { useImageViewer } from "../hook/useImageViewer";
import { imageViewerStoreApi, useImageViewerStore } from "../store/imageViewerStore";
import { imageViewerStyles } from "../style/imageViewerStyles";
import type { PanelProps } from "../type/imageViewer.types";
import { ImageViewerFooterToolbar, ImageViewerTopToolbar } from "./ImageViewerToolbar";

function progressLabel(status: string): string {
  return status === "downloading" ? "Loading image package" : "Backend is generating the image package";
}

function lensProgressLabel(status: string): string {
  if (status === "loadingPage") return "Decoding document page...";
  if (status === "copyingSelection") return "Copying selection...";
  return "Loading...";
}

export function ImageViewerPanel({ compact, hostInput, onLoaderChange, onReadyChange, previewAction }: PanelProps): JSX.Element {
  useLayoutEffect(() => {
    if (hostInput) imageViewerStoreApi.getState().setHostInput(hostInput);
  }, [hostInput]);

  const apiGatewayUrl = useImageViewerStore((state) => state.apiGatewayUrl);
  const authToken = useImageViewerStore((state) => state.authToken);
  const searchText = useImageViewerStore((state) => state.searchText);
  const session = useImageViewerStore((state) => state.session);
  const requestVersion = useImageViewerStore((state) => state.requestVersion);
  const status = useImageViewerStore((state) => state.status);
  const viewerStatus = useImageViewerStore((state) => state.viewerStatus);
  const workerClient = useImageViewerStore((state) => state.workerClient);
  const viewer = useImageViewer();
  const reloadRef = useRef(0);

  useEffect(() => {
    if (!apiGatewayUrl || !authToken || !session || viewer.isRestoring) return;
    const state = imageViewerStoreApi.getState();
    const hasPackage = Boolean(state.packageMetadata && state.tiffBytes && state.tiffType !== null);
    const restoredLensReady = state.status === "ready" && state.viewerState?.status === "ready" && !hasPackage;
    if (state.status === "packaging" || state.status === "polling" || state.status === "downloading") return;
    if (!state.onError) return;
    const restart = viewer.reloadId > reloadRef.current;
    if (!restart && viewer.isRestoredSession) return;
    if (!restart && ((state.status === "ready" && hasPackage) || restoredLensReady)) return;
    if (restart) reloadRef.current = viewer.reloadId;
    void loadImagePackage({
      apiGatewayUrl,
      authToken,
      onError: state.onError,
      packagePollIntervalMs: state.packagePollIntervalMs,
      restart,
      session,
      workerClient: workerClient ?? undefined,
    });
  }, [apiGatewayUrl, authToken, requestVersion, session, viewer.isRestoredSession, viewer.isRestoring, viewer.reloadId, workerClient]);

  const loading = status === "packaging" || status === "polling" || status === "downloading";
  const lensLoading = viewer.isRestoring || viewer.isLoading || viewerStatus === "addingPages" || viewerStatus === "copyingSelection" || viewerStatus === "loadingPage";
  const progress = loading || lensLoading;

  useEffect(() => {
    onReadyChange(status === "ready" && !lensLoading);
  }, [lensLoading, onReadyChange, status]);

  useEffect(() => {
    onLoaderChange?.(progress ? [loading ? progressLabel(status) : lensProgressLabel(viewerStatus)] : null);
  }, [loading, onLoaderChange, progress, status, viewerStatus]);

  return (
    <section aria-label="Image viewer" style={imageViewerStyles.root}>
      {!viewer.isThumbs || compact ? (
        <ImageViewerTopToolbar
          canActualSize={viewer.canActualSize}
          canClearSearch={viewer.canClearSearch}
          canExport={viewer.canExport}
          canFitHeight={viewer.canFitHeight}
          canFitPage={viewer.canFitPage}
          canFitWidth={viewer.canFitWidth}
          canSearch={viewer.canSearch}
          canSelect={viewer.canSelect}
          canZoomIn={viewer.canZoomIn}
          canZoomOut={viewer.canZoomOut}
          compact={compact}
          selecting={viewer.selecting}
          onAction={(action) => {
            if (action === "actualSize") viewer.actualSize();
            if (action === "clearSearch") viewer.clearSearch();
            if (action === "export") {
              void viewer.exportSelection().then((selection) => {
                if (selection) addIndexStoreApi.getState().open(selection);
              });
            }
            if (action === "fitHeight") viewer.fitHeight();
            if (action === "fitPage") viewer.fitPage();
            if (action === "fitWidth") viewer.fitWidth();
            if (action === "search") viewer.search();
            if (action === "select") viewer.select();
            if (action === "zoomIn") viewer.zoomIn();
            if (action === "zoomOut") viewer.zoomOut();
          }}
          onSearchText={(value) => imageViewerStoreApi.getState().setSearchText(value)}
          previewAction={previewAction}
          searchText={searchText}
          zoom={viewer.zoom}
        />
      ) : null}
      <div style={imageViewerStyles.body}>
        <div data-document-lens-host="true" ref={viewer.lensHostRef} style={imageViewerStyles.lensHost} />
      </div>
      {progress || viewer.isThumbs ? null : (
        <ImageViewerFooterToolbar
          canGoFirst={viewer.canGoFirst}
          canGoLast={viewer.canGoLast}
          canGoNext={viewer.canGoNext}
          canGoPrevious={viewer.canGoPrevious}
          canShowThumbnails={viewer.canShowThumbnails}
          onAction={(action) => {
            if (action === "first") viewer.firstPage();
            if (action === "last") viewer.lastPage();
            if (action === "next") viewer.nextPage();
            if (action === "previous") viewer.previousPage();
            if (action === "thumbs") viewer.showThumbnails();
          }}
          page={viewer.page}
          pageCount={viewer.pageCount}
        />
      )}
    </section>
  );
}
