import { requestResource } from "../../metdataview/data/metadataResource";
import { createWorkerClient } from "../worker/imageWorkerClient";
import type { DataResponse, WorkerClient } from "../type/imageViewer.types";
import type { GenerationInput } from "../../../shared/type/generation.types";

export async function generateImagePackage(input: GenerationInput, recovery?: boolean, workerClient?: WorkerClient): Promise<DataResponse> {
  const etag = recovery ? null : await requestResource({ resource: "metadata_etag" }, input.session, input);
  return (workerClient || createWorkerClient({ apiBaseUrl: input.apiGatewayUrl })).packageImage(input.authToken, input.session, etag);
}
