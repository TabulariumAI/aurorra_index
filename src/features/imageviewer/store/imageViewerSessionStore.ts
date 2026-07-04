import type { ViewerConfig, ViewerSession, ViewerSessionStore } from "@tabulariumai/aurora-lens";

type DocumentInput = Parameters<ViewerSessionStore["resetDocument"]>[0];
type PageRecord = Awaited<ReturnType<ViewerSessionStore["resetDocument"]>>[number];
type PageBlob = Parameters<ViewerSessionStore["savePageBlob"]>[0];
type PageMetadata = Parameters<ViewerSessionStore["savePageMetadata"]>[0];

type SessionData = {
  config: ViewerConfig | null;
  document: ViewerSession["document"] | null;
  metadata: Map<string, unknown>;
  pages: PageRecord[];
  rasters: Map<string, PageBlob>;
};

const sessions = new Map<string, SessionData>();

function sessionData(key: string): SessionData {
  const existing = sessions.get(key);
  if (existing) return existing;
  const created: SessionData = {
    config: null,
    document: null,
    metadata: new Map(),
    pages: [],
    rasters: new Map(),
  };
  sessions.set(key, created);
  return created;
}

function ordered(pages: PageRecord[], updatedAt: number): PageRecord[] {
  return pages.map((page, index) => ({ ...page, sequenceNumber: index, updatedAt }));
}

function current(data: SessionData): ViewerSession {
  if (!data.document) throw new Error("Image viewer session document is missing.");
  const currentPage = data.pages.find((page) => page.pageId === data.document?.currentPageId);
  if (!currentPage) throw new Error("Image viewer session current page is missing.");
  return {
    document: data.document,
    pages: data.pages,
    currentPage,
  };
}

export class ImageViewerSessionStore implements ViewerSessionStore {
  constructor(private readonly key: string) {}

  async resetDocument(input: DocumentInput): Promise<PageRecord[]> {
    const data = sessionData(this.key);
    const pages = ordered(input.pages, input.updatedAt);
    const currentPage = pages[input.currentPageIndex];
    if (!currentPage) throw new Error("Image viewer session current page is missing.");
    data.document = {
      id: "active",
      fileName: input.fileName,
      fileType: input.fileType,
      fileBlob: input.fileBlob,
      currentPageId: currentPage.pageId,
      updatedAt: input.updatedAt,
    };
    data.pages = pages;
    data.metadata.clear();
    data.rasters.clear();
    return pages;
  }

  async insertPages(insertIndex: number, pages: PageRecord[], rasters: PageBlob[], updatedAt: number): Promise<PageRecord[]> {
    const data = sessionData(this.key);
    current(data);
    if (insertIndex < 0 || insertIndex > data.pages.length) throw new Error("Image viewer insert index is invalid.");
    data.pages = ordered([...data.pages.slice(0, insertIndex), ...pages, ...data.pages.slice(insertIndex)], updatedAt);
    rasters.forEach((raster) => data.rasters.set(raster.pageId, raster));
    return data.pages;
  }

  async removePages(pageIds: string[], updatedAt: number): Promise<PageRecord[]> {
    const data = sessionData(this.key);
    const session = current(data);
    const remove = new Set(pageIds);
    if (remove.has(session.currentPage.pageId)) throw new Error("Image viewer current page cannot be removed.");
    data.pages = ordered(data.pages.filter((page) => !remove.has(page.pageId)), updatedAt);
    pageIds.forEach((pageId) => {
      data.metadata.delete(pageId);
      data.rasters.delete(pageId);
    });
    return data.pages;
  }

  async read(): Promise<ViewerSession | null> {
    const data = sessionData(this.key);
    if (!data.document || data.pages.length === 0) return null;
    return current(data);
  }

  async readPageBlobRecord(pageId: string): Promise<PageBlob | null> {
    return sessionData(this.key).rasters.get(pageId) ?? null;
  }

  async readPageMetadata(pageId: string): Promise<unknown | null> {
    return sessionData(this.key).metadata.get(pageId) ?? null;
  }

  async readPageMetadataIds(): Promise<Set<string>> {
    return new Set(sessionData(this.key).metadata.keys());
  }

  async readViewerConfig(): Promise<ViewerConfig> {
    const data = sessionData(this.key);
    if (data.config) return data.config;
    const { defaultViewerConfig } = await import("@tabulariumai/aurora-lens");
    return defaultViewerConfig();
  }

  async reorderPages(fromPageIndex: number, toPageIndex: number, updatedAt: number): Promise<PageRecord[]> {
    const data = sessionData(this.key);
    current(data);
    if (fromPageIndex < 0 || fromPageIndex >= data.pages.length || toPageIndex < 0 || toPageIndex >= data.pages.length) {
      throw new Error("Image viewer page reorder index is invalid.");
    }
    const pages = [...data.pages];
    const [page] = pages.splice(fromPageIndex, 1);
    pages.splice(toPageIndex, 0, page);
    data.pages = ordered(pages, updatedAt);
    return data.pages;
  }

  async saveCurrentPage(pageId: string, updatedAt: number): Promise<void> {
    const data = sessionData(this.key);
    const session = current(data);
    if (!session.pages.some((page) => page.pageId === pageId)) throw new Error("Image viewer current page is invalid.");
    data.document = { ...session.document, currentPageId: pageId, updatedAt };
  }

  async savePageBlob(record: PageBlob): Promise<void> {
    sessionData(this.key).rasters.set(record.pageId, record);
  }

  async savePageMetadata(record: PageMetadata): Promise<void> {
    sessionData(this.key).metadata.set(record.pageId, record.metadata);
  }

  async saveViewerConfig(config: ViewerConfig): Promise<ViewerConfig> {
    sessionData(this.key).config = config;
    return config;
  }

  async delete(): Promise<void> {
    sessions.delete(this.key);
  }
}
