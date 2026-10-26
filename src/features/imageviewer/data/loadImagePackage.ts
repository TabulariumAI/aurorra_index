import { generateImagePackage } from "./generateImagePackage";
import { imageViewerStoreApi } from "../store/imageViewerStore";
import type { HostInput, LoadPackageInput } from "../type/imageViewer.types";
import { createWorkerClient } from "../worker/imageWorkerClient";
import { parsePackageUrls, toViewerError } from "./imageViewerData";

const activeLoads = new Map<string, Promise<void>>();

async function runImagePackage(input: LoadPackageInput): Promise<void> {
  const state = imageViewerStoreApi.getState();
  const hostInput: HostInput = {
    pageSize: input.pageSize,
    apiGatewayUrl: input.apiGatewayUrl,
    authToken: input.authToken,
    onError: input.onError,
    pageMap: state.pageMap,
    request: state.request,
    selectedIndex: state.selectedIndex,
    session: input.session,
    workerClient: input.workerClient,
  };
  state.setHostInput(hostInput);
  const current = imageViewerStoreApi.getState();
  const loaded = Boolean(current.packageMetadata && current.tiffBytes && current.tiffType !== null);
  const restoredLensReady = current.status === "ready" && current.viewerState?.status === "ready" && !loaded;
  if (!input.restart && ((current.status === "ready" && loaded) || restoredLensReady)) return;

  const client = input.workerClient || createWorkerClient({ apiBaseUrl: input.apiGatewayUrl });
  try {
    imageViewerStoreApi.getState().setStatus("packaging");
    const data = await generateImagePackage(input, input.restart, client);
    if (imageViewerStoreApi.getState().session !== input.session) return;
    imageViewerStoreApi.getState().setPackageStatus("completed");
    imageViewerStoreApi.getState().setStatus("downloading");
    const urls = parsePackageUrls(data.data);
    const localPackage = await client.downloadPackage(input.authToken, urls);
    if (imageViewerStoreApi.getState().session === input.session) {
      imageViewerStoreApi.getState().setLocalPackage(localPackage);
    }
  } catch (error) {
    const workerError = toViewerError(error, "image package request failed.");
    if (imageViewerStoreApi.getState().session === input.session) {
      imageViewerStoreApi.getState().setError(workerError);
    }
  }
}

export async function loadImagePackage(input: LoadPackageInput): Promise<void> {
  const activeLoad = activeLoads.get(input.session);
  if (activeLoad && !input.restart) return activeLoad;

  const load = activeLoad ? activeLoad.then(() => {
    if (imageViewerStoreApi.getState().session === input.session) return runImagePackage(input);
  }) : runImagePackage(input);
  activeLoads.set(input.session, load);
  try {
    await load;
  } finally {
    if (activeLoads.get(input.session) === load) activeLoads.delete(input.session);
  }
}
