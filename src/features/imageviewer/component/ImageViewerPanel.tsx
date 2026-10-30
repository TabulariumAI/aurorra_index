import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { addIndexStoreApi } from "../../addindex";
import { ConfButton, composeMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { loadImagePackage } from "../data/loadImagePackage";
import { matchSelection } from "../data/matchSelection";
import { isPageError } from "../data/imageViewerData";
import { useImageViewer } from "../hook/useImageViewer";
import { imageViewerStoreApi, useImageViewerStore } from "../store/imageViewerStore";
import { imageViewerStyles } from "../style/imageViewerStyles";
import type { PanelProps } from "../type/imageViewer.types";
import { ImageViewerFooterToolbar, ImageViewerTopToolbar } from "./ImageViewerToolbar";

function progressLabel(status: string): string {
  return status === "downloading" ? "Loading image package" : "Generating the image package";
}

function lensProgressLabel(status: string): string {
  if (status === "loadingPage") return "Decoding document page...";
  return "Loading...";
}

export function ImageViewerPanel({ compact, hostInput, renderTolerance, onAddIndex, onIndexFocus, onLoaderChange, onReadyChange }: PanelProps): JSX.Element {
  useLayoutEffect(() => {
    if (hostInput) imageViewerStoreApi.getState().setHostInput(hostInput);
  }, [hostInput]);

  const pageSize = useImageViewerStore(state => state.pageSize);
  const apiGatewayUrl = useImageViewerStore((state) => state.apiGatewayUrl);
  const authToken = useImageViewerStore((state) => state.authToken);
  const searchText = useImageViewerStore((state) => state.searchText);
  const session = useImageViewerStore((state) => state.session);
  const requestVersion = useImageViewerStore((state) => state.requestVersion);
  const status = useImageViewerStore((state) => state.status);
  const viewerStatus = useImageViewerStore((state) => state.viewerStatus);
  const workerClient = useImageViewerStore((state) => state.workerClient);
  const viewer = useImageViewer();
  const [sizeAnchor, setSizeAnchor] = useState<HTMLButtonElement | null>(null);
  const exportRef = useRef<HTMLButtonElement>(null);
  const reloadRef = useRef(0);
  const [matchFailure, setMatchFailure] = useState<{ session: string; version: number } | null>(null);

  useEffect(() => {
    if (!pageSize || !apiGatewayUrl || !authToken || !session || viewer.isRestoring || viewer.hasRequestError) return;
    const state = imageViewerStoreApi.getState();
    const hasPackage = Boolean(state.packageMetadata && state.tiffBytes && state.tiffType !== null);
    const restoredLensReady = state.status === "ready" && state.viewerState?.status === "ready" && !hasPackage;
    if (state.status === "packaging" || state.status === "downloading") return;
    if (!state.onError) return;
    const restart = viewer.reloadId > reloadRef.current;
    if (!restart && viewer.isRestoredSession) return;
    if (!restart && ((hasPackage && (state.status === "ready" || isPageError(state.error))) || restoredLensReady)) return;
    if (restart) reloadRef.current = viewer.reloadId;
    console.info("imageviewer package load start", {
      hasPackage,
      page: state.request?.page ?? null,
      reason: restart ? "lens_page_metadata_missing" : "initial_or_missing_package",
      reloadId: viewer.reloadId,
      requestVersion,
      session,
      status: state.status,
    });
    void loadImagePackage({
      pageSize,
      apiGatewayUrl,
      authToken,
      onError: state.onError,
      restart,
      session,
      workerClient: workerClient ?? undefined,
    });
  }, [pageSize, apiGatewayUrl, authToken, requestVersion, session, viewer.hasRequestError, viewer.isRestoredSession, viewer.isRestoring, viewer.reloadId, workerClient]);

  const loading = status === "packaging" || status === "downloading";
  const lensLoading = !viewer.isNavigating && (viewer.isRestoring || viewer.isLoading || viewerStatus === "addingPages" || viewerStatus === "loadingPage");
  const progress = loading || lensLoading;

  useEffect(() => {
    onReadyChange(status === "ready" && !lensLoading);
  }, [lensLoading, onReadyChange, status]);

  useEffect(() => {
    onLoaderChange?.(progress ? [loading ? progressLabel(status) : lensProgressLabel(viewerStatus)] : null);
  }, [loading, onLoaderChange, progress, status, viewerStatus]);

  return (
    <section aria-label="Image viewer" style={imageViewerStyles.root}>
      {sizeAnchor && viewer.sizeFailure ? renderTolerance({
        anchor: sizeAnchor,
        onClose: viewer.cancelSize,
        children: (
          <section style={imageViewerStyles.sizePrompt}>
            <p style={imageViewerStyles.sizeMessage}><strong>{viewer.sizeFailure.sourceName}</strong></p>
            <p style={imageViewerStyles.sizeMessage}>Page {viewer.sizeFailure.pageNumber}: {viewer.sizeFailure.width} × {viewer.sizeFailure.height} px</p>
            <p style={imageViewerStyles.sizeMessage}>
              This page exceeds the configured size tolerance of {Number((viewer.sizeFailure.tolerance * 100).toFixed(2))}%.
              Processing requires a higher tolerance of {Number((viewer.sizeFailure.requiredTolerance * 100).toFixed(2))}%.
              This change applies only to this preview.
            </p>
            <div style={imageViewerStyles.sizeActions}>
              <ConfButton label="Cancel" variant="secondary" requireConfirmation={false} onConfirm={viewer.cancelSize} />
              <ConfButton label="Process anyway" variant="primary" requireConfirmation={false} onConfirm={viewer.acceptSize} />
            </div>
          </section>
        ),
      }) : null}
      {viewer.sizeFailure || !viewer.isThumbs || compact ? (
        <ImageViewerTopToolbar
          scaleRef={setSizeAnchor}
          exportRef={exportRef}
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
            viewer.setNoMatch(null);
            if (action !== "match") setMatchFailure(null);
            if (action === "actualSize") viewer.actualSize();
            if (action === "clearSearch") viewer.clearSearch();
            if (action === "copy") void viewer.copySelection();
            if (action === "export") {
              void viewer.exportSelection().then((selection) => {
                if (selection) {
                  addIndexStoreApi.getState().open(selection);
                  onAddIndex?.(exportRef.current!);
                }
              });
            }
            if (action === "fitHeight") viewer.fitHeight();
            if (action === "fitPage") viewer.fitPage();
            if (action === "fitWidth") viewer.fitWidth();
            if (action === "match") {
              void viewer.exportSelection().then((selection) => {
                const state = imageViewerStoreApi.getState();
                if (!selection || !session || state.session !== session || state.requestVersion !== requestVersion) return;
                const metadata = composeMetadataJSON(storeApi.getState().getJSON(session));
                const match = metadata ? matchSelection(selection, metadata) : null;
                setMatchFailure(match ? null : { session, version: requestVersion });
                if (match) onIndexFocus?.(match);
              });
            }
            if (action === "search") viewer.search();
            if (action === "select") viewer.select();
            if (action === "zoomIn") viewer.zoomIn();
            if (action === "zoomOut") viewer.zoomOut();
          }}
          onSearchText={(value) => imageViewerStoreApi.getState().setSearchText(value)}
          searchText={searchText}
          zoom={viewer.zoom}
        />
      ) : null}
      <div style={imageViewerStyles.body}>
        <div data-document-lens-host="true" ref={viewer.lensHostRef} style={imageViewerStyles.lensHost} />
        {viewer.noMatch || matchFailure !== null && matchFailure.session === session && matchFailure.version === requestVersion ? (
          <div role="status" aria-label="Index match result" style={imageViewerStyles.matchStatus}>
            {viewer.noMatch ? "Cant match the requested text." : "No matching index found"}
          </div>
        ) : null}
      </div>
      {progress || viewer.isThumbs ? null : (
        <ImageViewerFooterToolbar
          canGoFirst={viewer.canGoFirst}
          canGoLast={viewer.canGoLast}
          canGoNext={viewer.canGoNext}
          canGoPrevious={viewer.canGoPrevious}
          canShowThumbnails={viewer.canShowThumbnails}
          onAction={(action) => {
            viewer.setNoMatch(null);
            setMatchFailure(null);
            if (action === "first") viewer.firstPage();
            if (action === "last") viewer.lastPage();
            if (action === "next") viewer.nextPage();
            if (action === "previous") viewer.previousPage();
            if (action === "thumbs") viewer.showThumbnails();
          }}
          page={viewer.page}
          pageName={viewer.pageName}
          pageCount={viewer.pageCount}
        />
      )}
    </section>
  );
}
