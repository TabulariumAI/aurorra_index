import { beforeEach, expect, it, vi } from "vitest";
import { loadChoices } from "../data/loadChoices";
import { requestResource } from "../../metdataview/data/metadataResource";
import { indexStoreApi } from "../../metdataview/store/metadataStore";

const worker = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../worker/choicesWorkerClient", () => ({ createSessionDataWorkerClient: () => worker }));
const input = { session: "selected", authToken: "token", apiGatewayUrl: "https://gateway" };
const backend = { items: [{ service: "Recognition", level: 2 }, { service: "PartyClauseIndexing", level: 0 }], jurisdiction: "Texas, Harris County" };
beforeEach(() => { indexStoreApi.getState().resetMetadata(); worker.load.mockReset(); });

it("stores and serves the selected backend choices without applying settings defaults", async () => {
  indexStoreApi.getState().selectSession("selected");
  worker.load.mockResolvedValue(backend);
  const result = await loadChoices(input);
  expect(worker.load).toHaveBeenCalledExactlyOnceWith("token", "selected");
  expect(indexStoreApi.getState().choices).toEqual(backend);
  expect(result).not.toBe(indexStoreApi.getState().choices);
  const resource = await requestResource({ resource: "session_choices" }, "selected");
  expect(resource).toEqual(backend);
  (resource as typeof backend).items[0].level = 6;
  expect(indexStoreApi.getState().choices).toEqual(backend);
  await expect(requestResource({ resource: "session_choices" }, "other")).resolves.toBeNull();
});

it.each(["switch", "reset"])("does not retain a response after %s", async action => {
  indexStoreApi.getState().selectSession("selected");
  let finish!: (value: typeof backend) => void;
  worker.load.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const pending = loadChoices(input);
  if (action === "switch") indexStoreApi.getState().selectSession("other");
  else indexStoreApi.getState().resetMetadata();
  finish(backend);
  await pending;
  expect(indexStoreApi.getState().choices).toBeNull();
});

it("reads another session for submission without replacing the selected session", async () => {
  indexStoreApi.getState().selectSession("selected");
  indexStoreApi.setState({ choices: backend });
  worker.load.mockResolvedValue({ items: [], jurisdiction: "California, Los Angeles County" });
  expect(await loadChoices({ ...input, session: "other" })).toEqual({ items: [], jurisdiction: "California, Los Angeles County" });
  expect(indexStoreApi.getState().choices).toEqual(backend);
});

it("propagates failures and clears choices with the selected session", async () => {
  indexStoreApi.getState().selectSession("selected");
  worker.load.mockRejectedValue(new Error("Unavailable"));
  await expect(loadChoices(input)).rejects.toThrow("Unavailable");
  expect(indexStoreApi.getState().choices).toBeNull();
  indexStoreApi.setState({ choices: backend });
  indexStoreApi.getState().resetMetadata();
  expect(indexStoreApi.getState().choices).toBeNull();
});
