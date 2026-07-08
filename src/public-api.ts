import { lazy } from "react";

export const ImageViewerPanel = lazy(async () => {
  const module = await import("./features/imageviewer/component/ImageViewerPanel");
  return { default: module.ImageViewerPanel };
});

export { IndexContainer, IndexContainer as IndexMetadata } from "./features/indexing/component/IndexContainer";
export {
  asIndexArray,
  composeMetadataJSON,
  getIndexedValue,
  getParcelOptions,
  getSegmentItems,
  getPanelData,
  indexAspects,
  indexSegments,
  isAmbiguous,
  isValidIndex,
  splitMetadataJSON,
} from "./features/metdata/data/metadataData";
export {
  formatLocation,
  getElements,
  getPresentLayers,
  getVal,
  isAllEmptyStructure,
  isBlank,
  normalizeLegalData,
  toPlatJSON,
} from "./features/legalmap/data/legalData";
export { LegalMapContent } from "./features/legalmap/component/LegalMapContent";
export { createDeferredState } from "./features/indexing/data/deferredState";
export { indexStoreApi, useIndexStore } from "./features/metdata/store/indexStore";
export { AddressMapContent } from "./features/addressmap";
export { appendAddressMapZoom, buildAddressMapEmbedUrl, DEFAULT_ADDRESS_MAP_ZOOM } from "./features/addressmap/data/addressMap";
export { createIndexWorkerClient } from "./features/metdata/worker/indexWorkerClient";
export {
  AuditPanel,
  auditStoreApi,
  createAuditWorkerClient,
  normalizeAuditReport,
  prepareAuditReport,
  useAuditReport,
  useAuditStore,
} from "./features/audit";
export {
  IqPanel,
  useIqReport,
  createIqWorkerClient,
  iqStoreApi,
  useIqStore,
  prepareIqReport,
  normalizeIqReport,
  GATE_FAIL,
  GATE_INFO,
  GATE_PASS,
  GATE_WARNING,
  UI_FAIL,
  UI_INFO,
  UI_PASS,
  UI_WARNING,
} from "./features/iq";
export {
  imageViewerStoreApi,
  useImageViewerStore,
} from "./features/imageviewer/store/imageViewerStore";
export { loadImagePackage } from "./features/imageviewer/data/loadImagePackage";
export type {
  HostInput,
  LoadPackageInput,
  PageRequest,
} from "./features/imageviewer/type/imageViewer.types";
export { useStore } from "./store/hook/useStore";
export { storeApi } from "./store/state/store";
export type { StateKey, StoreActions, StoreState, StoreValues } from "./store/type/store.types";
export type {
  IndexMetadataProps,
  IndexActionPayload,
  IndexChoice,
  IndexDeferredState,
  IndexMetadataCallbacks,
  IndexSegmentValues,
  IndexSelected,
  IndexStoreState,
  IndexWorkerClient,
  IndexWorkerCommand,
  IndexWorkerConfig,
  IndexWorkerError,
  IndexWorkerResult,
  LegalElement,
  LegalGroup,
  LegalPayload,
  MetadataHeading,
  MetadataIndex,
  MetadataPage,
  MetadataPayload,
  MetadataHeadingJSON,
  MetadataIndexJSON,
  MetadataChainJSON,
  MetadataFinancialJSON,
  MetadataLegalJSON,
  MetadataPagesJSON,
  MetadataSecretsJSON,
  MetadataJSONParts,
  MetadataStatus,
  MetadataPanelData,
} from "./features/metdata/type/metadata.types";
export type {
  IqAckResult,
  IqBucket,
  IqCallbacks,
  IqDecision,
  IqGate,
  IqGateStatus,
  IqGateView,
  IqPanelProps,
  IqReport,
  IqReportView,
  IqSegment,
  IqSegmentView,
  IqStartResult,
  IqStatus,
  IqStoreState,
  IqUiStatus,
  IqWorkerClient,
  IqWorkerCommand,
  IqWorkerConfig,
  IqWorkerError,
  IqWorkerResult,
} from "./features/iq";
export type {
  AuditCallbacks,
  AuditFilters,
  AuditGap,
  AuditGapView,
  AuditPanelProps,
  AuditReport,
  AuditReportView,
  AuditStoreState,
  AuditStatus,
  AuditUsage,
  AuditWorkerClient,
  AuditWorkerCommand,
  AuditWorkerConfig,
  AuditWorkerError,
  AuditWorkerResult,
} from "./features/audit";
