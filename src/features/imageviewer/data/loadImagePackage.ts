import { generateImagePackage } from "./generateImagePackage";
import { imageViewerStoreApi } from "../store/imageViewerStore";
import type { HostInput, LoadPackageInput } from "../type/imageViewer.types";
import { createWorkerClient } from "../worker/imageWorkerClient";
import { parsePackageUrls, toViewerError } from "./imageViewerData";

let activeLoad: { session: string; generation: number; load: Promise<void> } | null = null;

async function runImagePackage(input: LoadPackageInput, generation: number): Promise<void> {
  const current = imageViewerStoreApi.getState();
  const loaded = Boolean(current.packageMetadata && current.tiffBytes && current.tiffType !== null);
  const restoredLensReady = current.status === "ready" && current.viewerState?.status === "ready" && !loaded;
  if (!input.restart && ((current.status === "ready" && loaded) || restoredLensReady)) return;

  const client = input.workerClient || createWorkerClient({ apiBaseUrl: input.apiGatewayUrl });
  try {
    imageViewerStoreApi.getState().setStatus("packaging");
    const data = await generateImagePackage(input, input.restart, client);
    if (imageViewerStoreApi.getState().generation !== generation || imageViewerStoreApi.getState().session !== input.session) return;
    imageViewerStoreApi.getState().setPackageStatus("completed");
    imageViewerStoreApi.getState().setStatus("downloading");
    const urls = parsePackageUrls(data.data);
    const localPackage = await client.downloadPackage(input.authToken, urls);
    if (imageViewerStoreApi.getState().generation === generation && imageViewerStoreApi.getState().session === input.session) {
      imageViewerStoreApi.getState().setLocalPackage(localPackage);
    }
  } catch (error) {
    const workerError = toViewerError(error, "image package request failed.");
    if (imageViewerStoreApi.getState().generation === generation && imageViewerStoreApi.getState().session === input.session) {
      imageViewerStoreApi.getState().setError(workerError);
    }
  }
}

export async function loadImagePackage(input: LoadPackageInput): Promise<void> {
  const state = imageViewerStoreApi.getState();
  const hostInput: HostInput = {
    pageSize: input.pageSize,
    apiGatewayUrl: input.apiGatewayUrl,
    authToken: input.authToken,
    onError: input.onError,
    pageMap: state.session === input.session ? state.pageMap : new Map(),
    request: state.session === input.session ? state.request : null,
    selectedIndex: state.session === input.session ? state.selectedIndex : null,
    session: input.session,
    workerClient: input.workerClient,
  };
  state.setHostInput(hostInput);
  const generation = imageViewerStoreApi.getState().generation;
  const active = activeLoad?.session === input.session && activeLoad.generation === generation ? activeLoad : null;
  if (active && !input.restart) return active.load;
  const load = active ? active.load.then(() => {
    if (imageViewerStoreApi.getState().generation === generation && imageViewerStoreApi.getState().session === input.session) {
      return runImagePackage(input, generation);
    }
  }) : runImagePackage(input, generation);
  activeLoad = { session: input.session, generation, load };
  try {
    await load;
  } finally {
    if (activeLoad?.load === load) activeLoad = null;
  }
}
