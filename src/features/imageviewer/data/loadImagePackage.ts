import { imageViewerStoreApi } from "../store/imageViewerStore";
import type { HostInput, LoadPackageInput } from "../type/imageViewer.types";
import { createWorkerClient } from "../worker/imageWorkerClient";
import { parsePackageUrls, toViewerError } from "./imageViewerData";

export async function loadImagePackage(input: LoadPackageInput): Promise<void> {
  const state = imageViewerStoreApi.getState();
  const hostInput: HostInput = {
    apiGatewayUrl: input.apiGatewayUrl,
    authToken: input.authToken,
    onError: input.onError,
    onJobEvent: input.onJobEvent,
    pageCount: state.pageCount,
    pageMap: state.pageMap,
    packagePollIntervalMs: input.packagePollIntervalMs,
    request: state.request,
    selectedIndex: state.selectedIndex,
    session: input.session,
    workerClient: input.workerClient,
  };
  state.setHostInput(hostInput);
  const current = imageViewerStoreApi.getState();
  const loaded = Boolean(current.packageMetadata && current.tiffBytes && current.tiffType !== null);
  const restoredLensReady = current.status === "ready" && current.viewerState?.status === "ready" && !loaded;
  if (
    (current.status === "ready" && loaded) ||
    restoredLensReady ||
    current.status === "packaging" ||
    current.status === "polling" ||
    current.status === "downloading"
  ) return;

  const client = input.workerClient || createWorkerClient({ apiBaseUrl: input.apiGatewayUrl });
  let jobId = crypto.randomUUID();
  let failure = "Image package request failed";
  let pending = false;

  try {
    imageViewerStoreApi.getState().setStatus("packaging");
    pending = true;
    input.onJobEvent({ jobId, message: "Requesting image package", phase: "started", session: input.session });
    await client.packageImage(input.authToken, input.session);
    input.onJobEvent({ jobId, message: "Image package requested", phase: "completed", session: input.session });
    pending = false;
    jobId = crypto.randomUUID();
    failure = "Image package status failed";
    pending = true;
    input.onJobEvent({ jobId, message: "Checking image package status", phase: "started", session: input.session });
    let current = await client.imageStatus(input.authToken, input.session);
    while (current.status === "pending" || current.status === "processing") {
      imageViewerStoreApi.getState().setStatus("polling");
      imageViewerStoreApi.getState().setPackageStatus(current.status);
      await new Promise((resolve) => setTimeout(resolve, imageViewerStoreApi.getState().packagePollIntervalMs));
      current = await client.imageStatus(input.authToken, input.session);
    }
    imageViewerStoreApi.getState().setPackageStatus(current.status === "completed" ? "completed" : "error");
    if (current.status !== "completed") {
      input.onJobEvent({ error: current.data, jobId, message: failure, phase: "failed", session: input.session });
      pending = false;
      imageViewerStoreApi.getState().setError({ code: "image_package_error", details: current, error: current.data });
      return;
    }
    input.onJobEvent({ jobId, message: "Image package status received", phase: "completed", session: input.session });
    pending = false;
    imageViewerStoreApi.getState().setStatus("downloading");
    jobId = crypto.randomUUID();
    failure = "Image package data failed";
    pending = true;
    input.onJobEvent({ jobId, message: "Loading image package data", phase: "started", session: input.session });
    const data = await client.imageData(input.authToken, input.session);
    input.onJobEvent({ jobId, message: "Image package data loaded", phase: "completed", session: input.session });
    pending = false;
    const urls = parsePackageUrls(data.data);
    jobId = crypto.randomUUID();
    failure = "Image package download failed";
    pending = true;
    input.onJobEvent({ jobId, message: "Downloading image package", phase: "started", session: input.session });
    const localPackage = await client.downloadPackage(input.authToken, urls);
    input.onJobEvent({ jobId, message: "Image package downloaded", phase: "completed", session: input.session });
    pending = false;
    if (imageViewerStoreApi.getState().session === input.session) {
      imageViewerStoreApi.getState().setLocalPackage(localPackage);
    }
  } catch (error) {
    const workerError = toViewerError(error, "image package request failed.");
    if (pending) {
      input.onJobEvent({ error: workerError.error, jobId, message: failure, phase: "failed", session: input.session });
    }
    if (imageViewerStoreApi.getState().session === input.session) {
      imageViewerStoreApi.getState().setError(workerError);
    } else {
      input.onError(workerError);
    }
  }
}
