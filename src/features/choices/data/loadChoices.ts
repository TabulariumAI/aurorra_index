import type { GenerationInput } from "../../../shared/type/generation.types";
import type { SessionChoices } from "../type/choices.types";
import { createSessionDataWorkerClient } from "../worker/choicesWorkerClient";
import { indexStoreApi } from "../../metdataview/store/metadataStore";
import { queueStoreApi } from "../../queue/store/queueStore";

export async function loadChoices(input: GenerationInput): Promise<SessionChoices | null> {
  const generation = queueStoreApi.getState().generation;
  const result = await createSessionDataWorkerClient({ apiBaseUrl: input.apiGatewayUrl }).load(input.authToken, input.session);
  const choices = result === null ? null : {
    items: result.items,
    jurisdiction: result.jurisdiction ?? null,
  };
  if (generation === queueStoreApi.getState().generation && queueStoreApi.getState().session === input.session) {
    indexStoreApi.setState({ choices: structuredClone(choices) });
  }
  return choices;
}
