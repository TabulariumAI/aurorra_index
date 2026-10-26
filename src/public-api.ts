import { lazy } from "react";
export { UsagePanel, useUsage } from "./features/usage";
export type { UsageRecord } from "./features/usage";
export { QueueExitPanel } from "./features/queueexit/component/QueueExitPanel";
export { useQueueExitStore } from "./features/queueexit/store/queueExitStore";

export const ImageViewerPanel = lazy(async () => {
  const module = await import("./features/imageviewer/component/ImageViewerPanel");
  return { default: module.ImageViewerPanel };
});

export { IndexContainer, IndexContainer as IndexMetadata } from "./features/indexing/component/IndexContainer";
export { MetadataPanel } from "./features/metdataview/component/MetadataPanel";
export type { MetadataPanelProps, MetadataPanelActions, MetadataPanelSections } from "./features/metdataview/component/MetadataPanel";

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
export { getMapGroups } from "./features/legalmap/data/surveyData";
export { LegalMapContent } from "./features/legalmap/component/LegalMapContent";
export type { LegalMapPayload } from "./features/legalmap/data/legalData";
export { createDeferredState } from "./features/indexing/data/deferredState";
export { indexStoreApi, useIndexStore } from "./features/metdataview/store/metadataStore";
export { AddressMapContent } from "./features/addressmap";
export { appendAddressMapZoom, buildAddressMapEmbedUrl, DEFAULT_ADDRESS_MAP_ZOOM } from "./features/addressmap/data/addressMap";
export { createMetadataClient } from "./features/metdataview/data/metadataClient";
export { requestResource } from "./features/metdataview/data/metadataResource";
export {
  PageSegmentsPanel,
  createPageSegmentsWorkerClient,
  pageSegmentsStoreApi,
  usePageSegmentsStore,
} from "./features/pagesegments";
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
  loadIqReport,
  generateIqReport,
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
  AddIndexPanel,
  addIndexStoreApi,
  useAddIndexStore,
} from "./features/addindex";
export {
  imageViewerStoreApi,
  useImageViewerStore,
} from "./features/imageviewer/store/imageViewerStore";
export { loadImagePackage } from "./features/imageviewer/data/loadImagePackage";
export { generateImagePackage } from "./features/imageviewer/data/generateImagePackage";
export type { GenerationInput } from "./shared/type/generation.types";
export type {
  HostInput,
  LoadPackageInput,
  PageRequest,
} from "./features/imageviewer/type/imageViewer.types";
export type {
  AddIndexPanelProps,
  AddIndexRequest,
  AddIndexSelection,
  AddIndexStoreState,
} from "./features/addindex";
export { EditIndexPanel, editIndexStoreApi, useEditIndexStore } from "./features/editindex";
export type { EditIndexPanelProps, EditIndexRequest, EditIndexStoreState } from "./features/editindex";
export { useStore } from "./store/hook/useStore";
export { storeApi } from "./store/state/store";
export type { StateKey, StoreActions, StoreState, StoreValues } from "./store/type/store.types";
export type {
  MetadataProps,
  MetadataChoice,
  MetadataDeferredState,
  MetadataRefresh,
  MetadataPatchResult,
  MetadataStoreState,
  MetadataClient,
  MetadataWorkerCommand,
  MetadataConfig,
  MetadataWorkerResult,
  MetadataReprocessResult,
} from "./features/metdataview/type/metadataView.types";
export type {
  PagesData,
  PageSegmentsFailure,
  PageSegmentsPanelProps,
  PageSegmentsWorkerClient,
  PageSegmentsWorkerCommand,
  PageSegmentsWorkerConfig,
  PageSegmentsWorkerError,
  PageSegmentsWorkerResult,
} from "./features/pagesegments";
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
  IqStatus,
  IqStoreState,
  IqUiStatus,
  IqWorkerClient,
  IqWorkerCommand,
  IqWorkerConfig,
  IqWorkerError,
  IqWorkerResult,
  LoadIqInput,
} from "./features/iq";
export type {
  AuditCallbacks,
  AuditFilters,
  AuditGap,
  AuditGapView,
  AuditPatch,
  AuditPanelProps,
  AuditReport,
  AuditReportView,
  AuditStoreState,
  AuditStatus,
  AuditUsage,
  AuditUsageService,
  AuditWorkerClient,
  AuditWorkerCommand,
  AuditWorkerConfig,
  AuditWorkerError,
  AuditWorkerResult,
} from "./features/audit";

export { queueStoreApi, useQueueStore } from "./features/queue/store/queueStore";
export type { QueueRequest, QueueRuntime } from "./features/queue/type/queue.types";

export type { QueueTransition, IndexChange } from "./features/queue/type/queue.types";
