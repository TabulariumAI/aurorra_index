import type { MetadataUpdate } from "aurora-core";
import { create } from "zustand";
import type { MetadataStoreState } from "../type/metadataView.types";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../../queue/store/queueStore";
import { auditStoreApi } from "../../audit/store/auditStore";
import { iqStoreApi } from "../../iq/store/iqStore";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { editIndexStoreApi } from "../../editindex/store/editIndexStore";
import { addIndexStoreApi } from "../../addindex/store/addIndexStore";
import { pageSegmentsStoreApi } from "../../pagesegments/store/pageSegmentsStore";

export const useIndexStore = create<MetadataStoreState>()((set, get) => ({
  activeSession: null,
  openSegment: null,
  error: null,
  pageError: null,
  pageRequest: null,
  refresh: null,
  refreshId: 0,
  retryAttempt: 0,
  status: "idle",
  getSegment(pageSegment) {
    const segment = get().openSegment;
    if (segment) return segment;
    set({ openSegment: pageSegment });
    return pageSegment;
  },
  invalidateSession(session) {
    if (get().activeSession !== session) return;
    storeApi.getState().removeJSON(session);
    set({ pageError: null, pageRequest: null, error: null, status: "idle" });
  },
  resetMetadata() {
    queueStoreApi.getState().reset();
    storeApi.getState().resetJSON();
    auditStoreApi.getState().resetAudit();
    iqStoreApi.getState().resetIq();
    imageViewerStoreApi.getState().resetViewer();
    editIndexStoreApi.getState().close();
    addIndexStoreApi.getState().close();
    pageSegmentsStoreApi.getState().close();
    pageSegmentsStoreApi.getState().reset([]);
    set({ pageError: null });
    get().resetView();
  },
  resetView() {
    set({ activeSession: null, openSegment: null, error: null, pageRequest: null,
      refresh: null, refreshId: 0, retryAttempt: 0, status: "idle" });
  },
  refreshMetadata(session, segment) {
    if (get().activeSession !== session) return;
    set(state => ({ refreshId: state.refreshId + 1, refresh: { id: state.refreshId + 1, segment, session } }));
  },
  setError(error) {
    set({ error, retryAttempt: 0, status: "error" });
  },
  setPageError(session, error) {
    if (get().activeSession === session) set({ pageError: error });
  },
  setPageLoading(session) {
    const request = crypto.randomUUID();
    if (get().activeSession === null) get().setLoading(session);
    if (get().activeSession === session) set({ pageRequest: request });
    return request;
  },
  setLoaded(session) {
    if (get().activeSession !== session) get().setLoading(session);
    set({ activeSession: session, error: null, retryAttempt: 0, status: "success" });
  },
  setLoading(session) {
    get().selectSession(session);
    set({ activeSession: session, error: null, retryAttempt: 1, status: "loading" });
  },
  selectSession(session) {
    if ([get().activeSession, queueStoreApi.getState().session, storeApi.getState().session]
      .some(owner => owner !== null && owner !== session)) get().resetMetadata();
    queueStoreApi.setState(state => state.session === session ? state : { session });
    storeApi.setState(state => state.session === session ? state : { session, json: null });
  },
  setRetryAttempt(retryAttempt) {
    set({ retryAttempt });
  },
}));

export const indexStoreApi = useIndexStore;

export function selectSession(input: Pick<MetadataUpdate, "session" | "etag">): void {
  indexStoreApi.getState().selectSession(input.session);
  queueStoreApi.getState().setEtag(input.session, input.etag ?? null);
}
