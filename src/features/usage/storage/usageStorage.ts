import type { UsageRecord } from "../type/usage.types";
import { usageRange } from "../data/usageData";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function syncUsage(owner: string, services: readonly UsageRecord[], now: number): Promise<UsageRecord[]> {
  const request = indexedDB.open("aurorra-index", 2);
  request.onupgradeneeded = event => {
    if (event.oldVersion === 1) request.result.deleteObjectStore("usage");
    request.result.createObjectStore("usage", { keyPath: ["owner", "code"] }).createIndex("owner", "owner");
  };
  const database = await requestResult(request);
  try {
    const { from, to } = usageRange(now);
    const transaction = database.transaction("usage", "readwrite");
    const done = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
    const store = transaction.objectStore("usage");
    try {
      await new Promise<void>((resolve, reject) => {
        const cursor = store.openCursor();
        cursor.onerror = () => reject(cursor.error);
        cursor.onsuccess = () => {
          if (!cursor.result) { resolve(); return; }
          const day = (cursor.result.value as UsageRecord).timestamp.slice(0, 10);
          if (day < from || day > to) cursor.result.delete();
          cursor.result.continue();
        };
      });
      for (const service of services) {
        const day = service.timestamp.slice(0, 10);
        if (day < from || day > to) continue;
        if (await requestResult(store.get([owner, service.code])) === undefined) {
          await requestResult(store.add({ ...service, owner }));
        }
      }
      const rows = await requestResult(store.index("owner").getAll(owner)) as (UsageRecord & { owner: string })[];
      await done;
      return rows.map(({ owner: _owner, ...service }) => service).sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.code.localeCompare(b.code));
    } catch (error) {
      await done.catch(() => undefined);
      throw error;
    }
  } finally { database.close(); }
}
