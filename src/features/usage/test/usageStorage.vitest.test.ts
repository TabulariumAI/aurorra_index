import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncUsage } from "../storage/usageStorage";
import type { UsageRecord } from "../type/usage.types";

const now = Date.parse("2026-10-08T12:00:00Z");
const record = (code: string, timestamp: string, cost = 11): UsageRecord => ({
  session: "session-one", code, timestamp, name: "extraction", cost, page_num: 2,
});

beforeEach(() => vi.stubGlobal("indexedDB", new IDBFactory()));

describe("usage persistence", () => {
  it("retains one record per group and operation through repeated audit downloads", async () => {
    const services = (["extraction", "iq_refinement", "refinement", "model_generation"] as const).map((name, index) => ({
      ...record(`group-${index}`, "2026-10-05T00:00:00Z"), name, cost: index + 1, time: index + 2,
    }));
    await syncUsage("owner", services, now);
    await syncUsage("owner", services, now);
    const next = services.map(service => ({ ...service, code: service.code + "-next" }));
    const rows = await syncUsage("owner", [...services, ...next], now);
    expect(rows).toHaveLength(8);
    for (const name of services.map(service => service.name)) expect(rows.filter(row => row.name === name)).toHaveLength(2);
    expect(rows.filter(row => row.name === "model_generation").map(row => row.cost)).toEqual([4, 4]);
  });
  it("rebuilds the version-one cache and persists session identities across jobs", async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("aurorra-index", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("usage", { keyPath: ["owner", "code"] }).createIndex("owner", "owner");
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("usage", "readwrite");
        const { session: _session, ...service } = record("old", "2026-10-01T12:00:00Z");
        transaction.objectStore("usage").add({ ...service, owner: "owner" });
        transaction.objectStore("usage").add({ ...service, owner: "other" });
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onabort = () => { database.close(); reject(transaction.error); };
      };
    });
    const current = record("old", "2026-10-01T12:00:00Z");
    expect(await syncUsage("owner", [current], now)).toEqual([current]);
    expect(await syncUsage("owner", [], now)).toEqual([current]);
    expect(await syncUsage("other", [], now)).toEqual([]);
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("aurorra-index");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        expect(request.result.version).toBe(2);
        request.result.close();
        resolve();
      };
    });
  });

  it("ignores repeated GUIDs without replacing the first persisted event", async () => {
    const first = record("same", "2026-10-01T12:00:00Z");
    await syncUsage("owner", [first], now);
    expect(await syncUsage("owner", [{ ...first, cost: 99, session: "another" }, first], now)).toEqual([first]);
  });

  it("isolates owners and serializes concurrent duplicate writes", async () => {
    const first = record("same", "2026-10-01T12:00:00Z");
    await Promise.all([syncUsage("one", [first], now), syncUsage("one", [first], now), syncUsage("two", [{ ...first, cost: 22 }], now)]);
    expect(await syncUsage("one", [], now)).toEqual([first]);
    expect((await syncUsage("two", [], now))[0].cost).toBe(22);
  });

  it("prunes and rejects events outside both retained months in the same job", async () => {
    const entries = [record("old", "2026-08-31T23:59:59Z"), record("start", "2026-09-01T00:00:00Z"),
      record("end", "2026-10-31T23:59:59Z"), record("future", "2026-11-01T00:00:00Z")];
    expect((await syncUsage("owner", entries, now)).map(row => row.code)).toEqual(["start", "end"]);
    expect((await syncUsage("owner", [], Date.parse("2026-11-01T00:00:00Z"))).map(row => row.code)).toEqual(["end"]);
  });

  it("prunes other owners when the current owner's background job runs", async () => {
    await syncUsage("other", [record("a", "2026-09-01T00:00:00Z")], now);
    await syncUsage("owner", [], Date.parse("2026-11-01T00:00:00Z"));
    expect(await syncUsage("other", [], Date.parse("2026-11-01T00:00:00Z"))).toEqual([]);
  });

  it("rolls back cleanup with an aborted insert and allows the next job to complete", async () => {
    const first = record("first", "2026-09-01T00:00:00Z");
    await syncUsage("owner", [first], now);
    const add = IDBObjectStore.prototype.add;
    const failure = vi.spyOn(IDBObjectStore.prototype, "add").mockImplementationOnce(function (this: IDBObjectStore, value, key) {
      this.transaction.abort();
      return add.call(this, value, key);
    });
    await expect(syncUsage("owner", [record("new", "2026-11-01T00:00:00Z")], Date.parse("2026-11-01T00:00:00Z"))).rejects.toBeDefined();
    failure.mockRestore();
    expect(await syncUsage("owner", [], now)).toEqual([first]);
  });
});
