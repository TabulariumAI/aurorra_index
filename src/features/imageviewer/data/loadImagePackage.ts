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
  if (
    (current.status === "ready" && loaded) ||
    current.status === "packaging" ||
    current.status === "polling" ||
    current.status === "downloading"
  ) return;

  const client = input.workerClient || createWorkerClient({ apiBaseUrl: input.apiGatewayUrl });

  try {
    imageViewerStoreApi.getState().setStatus("packaging");
    await client.packageImage(input.authToken, input.session);
    let current = await client.imageStatus(input.authToken, input.session);
    while (current.status === "pending" || current.status === "processing") {
      imageViewerStoreApi.getState().setStatus("polling");
      imageViewerStoreApi.getState().setPackageStatus(current.status);
      await new Promise((resolve) => setTimeout(resolve, imageViewerStoreApi.getState().packagePollIntervalMs));
      current = await client.imageStatus(input.authToken, input.session);
    }
    imageViewerStoreApi.getState().setPackageStatus(current.status === "completed" ? "completed" : "error");
    if (current.status !== "completed") {
      imageViewerStoreApi.getState().setError({ code: "image_package_error", details: current, error: current.data });
      return;
    }
    imageViewerStoreApi.getState().setStatus("downloading");
    const data = await client.imageData(input.authToken, input.session);
    const urls = parsePackageUrls(data.data);
    imageViewerStoreApi.getState().setLocalPackage(await client.downloadPackage(input.authToken, urls));
  } catch (error) {
    imageViewerStoreApi.getState().setError(toViewerError(error, "image package request failed."));
  }
}
