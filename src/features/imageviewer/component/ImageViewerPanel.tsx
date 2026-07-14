import { ProgressBar } from "aurorra-ui";
import { useEffect, useLayoutEffect } from "react";
import type { JSX } from "react";
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

export function ImageViewerPanel({ hostInput, previewAction }: PanelProps): JSX.Element {
  useLayoutEffect(() => {
    if (hostInput) imageViewerStoreApi.getState().setHostInput(hostInput);
  }, [hostInput]);

  const apiGatewayUrl = useImageViewerStore((state) => state.apiGatewayUrl);
  const authToken = useImageViewerStore((state) => state.authToken);
  const onJobEvent = useImageViewerStore((state) => state.onJobEvent);
  const searchText = useImageViewerStore((state) => state.searchText);
  const session = useImageViewerStore((state) => state.session);
  const status = useImageViewerStore((state) => state.status);
  const viewerStatus = useImageViewerStore((state) => state.viewerStatus);
  const workerClient = useImageViewerStore((state) => state.workerClient);
  const viewer = useImageViewer();

  useEffect(() => {
    if (!apiGatewayUrl || !authToken || !session || viewer.isRestoring || viewer.isRestoredSession) return;
    const state = imageViewerStoreApi.getState();
    const hasPackage = Boolean(state.packageMetadata && state.tiffBytes && state.tiffType !== null);
    const restoredLensReady = state.status === "ready" && state.viewerState?.status === "ready" && !hasPackage;
    if (
      (state.status === "ready" && hasPackage) ||
      restoredLensReady ||
      state.status === "packaging" ||
      state.status === "polling" ||
      state.status === "downloading"
    ) return;
    if (!state.onError || !onJobEvent) return;
    void loadImagePackage({
      apiGatewayUrl,
      authToken,
      onError: state.onError,
      onJobEvent,
      packagePollIntervalMs: state.packagePollIntervalMs,
      session,
      workerClient: workerClient ?? undefined,
    });
  }, [apiGatewayUrl, authToken, onJobEvent, session, viewer.isRestoredSession, viewer.isRestoring, workerClient]);

  const loading = status === "packaging" || status === "polling" || status === "downloading";
  const lensLoading = viewer.isRestoring || viewer.isLoading || viewerStatus === "addingPages" || viewerStatus === "loadingPage";
  const progress = loading || lensLoading;

  return (
    <section aria-label="Image viewer" style={imageViewerStyles.root}>
      {viewer.isThumbs ? null : (
        <ImageViewerTopToolbar
          canActualSize={viewer.canActualSize}
          canClearSearch={viewer.canClearSearch}
          canFitHeight={viewer.canFitHeight}
          canFitPage={viewer.canFitPage}
          canFitWidth={viewer.canFitWidth}
          canSearch={viewer.canSearch}
          canZoomIn={viewer.canZoomIn}
          canZoomOut={viewer.canZoomOut}
          onAction={(action) => {
            if (action === "actualSize") viewer.actualSize();
            if (action === "clearSearch") viewer.clearSearch();
            if (action === "fitHeight") viewer.fitHeight();
            if (action === "fitPage") viewer.fitPage();
            if (action === "fitWidth") viewer.fitWidth();
            if (action === "search") viewer.search();
            if (action === "zoomIn") viewer.zoomIn();
            if (action === "zoomOut") viewer.zoomOut();
          }}
          onSearchText={(value) => imageViewerStoreApi.getState().setSearchText(value)}
          previewAction={previewAction}
          searchText={searchText}
        />
      )}
      <div style={imageViewerStyles.body}>
        <div data-document-lens-host="true" ref={viewer.lensHostRef} style={imageViewerStyles.lensHost} />
        {progress ? (
          <div style={imageViewerStyles.overlay}>
            <ProgressBar
              ariaLabel="image viewer progress"
              continuous
              label={loading ? progressLabel(status) : lensProgressLabel(viewerStatus)}
              running
              showText
              visible
            />
          </div>
        ) : null}
      </div>
      {viewer.isThumbs ? null : (
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
