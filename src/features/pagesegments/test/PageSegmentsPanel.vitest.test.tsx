import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeApi } from "../../../store/state/store";
import { splitMetadataJSON } from "../../metdata/data/metadataData";
import type { MetadataPayload } from "../../metdata/type/metadata.types";
import { PageSegmentsPanel } from "../component/PageSegmentsPanel";
import { pageSegmentsStoreApi } from "../store/pageSegmentsStore";
import { useState } from "react";

const metadata = {
  heading: { title: "Instrument" },
  indexes: [],
  pages: {
    nonrecordables: [{ code: "page-b", name: "2", segments: ["property"] }],
    num_of_pages: 2,
    recordables: [{ code: "page-a", name: "1", segments: ["reference"] }],
  },
  secrets: [],
} as MetadataPayload;

describe("PageSegmentsPanel", () => {
  afterEach(() => {
    storeApi.getState().resetAllState();
    pageSegmentsStoreApi.getState().reset([]);
    vi.unstubAllGlobals();
  });

  it("initializes from props, filters choices, submits once, updates cache, and completes", async () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();
    const onError = vi.fn();
    const onJobEvent = vi.fn();
    const workerClient = {
      updatePageSegments: vi.fn(async () => undefined),
    };
    storeApi.getState().setJSON("session-1", splitMetadataJSON(metadata));

    render(
      <PageSegmentsPanel
        apiGatewayUrl="https://doc.example.com"
        authToken="token-1"
        choices={[{ level: 1, service: "RecitalIndexing" }, { level: 1, service: "ConfidentialIndexing" }]}
        onClose={onClose}
        onComplete={onComplete}
        onError={onError}
        onJobEvent={onJobEvent}
        pageClass="blank"
        pageCode="page-a"
        segments={["reference"]}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Referance(Rectal)" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Record Endorsements" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Confidential" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(workerClient.updatePageSegments).toHaveBeenCalledTimes(1));
    expect(workerClient.updatePageSegments).toHaveBeenCalledWith("token-1", "session-1", "page-a", ["reference", "secrets"]);
    expect(onComplete).toHaveBeenCalledWith({ pageCode: "page-a", segments: ["reference", "secrets"], session: "session-1" });
    expect(onError).not.toHaveBeenCalled();
    expect(onJobEvent.mock.calls.map(([event]) => event.phase)).toEqual(["started", "completed"]);
    expect(storeApi.getState().getJSON("session-1")?.pagesJSON.pages?.recordables?.[0].segments).toEqual(["reference", "secrets"]);
    expect(screen.getByText("Page segment changes saved.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps submitted selection on failure and restores committed state on cancel", async () => {
    const onError = vi.fn();
    const error = Object.assign(new Error("Missing page"), { code: "page_segments_page_not_found", status: 404 });
    const workerClient = {
      updatePageSegments: vi.fn(async () => {
        throw error;
      }),
    };
    storeApi.getState().setJSON("session-1", splitMetadataJSON(metadata));

    render(
      <PageSegmentsPanel
        apiGatewayUrl="https://doc.example.com"
        authToken="token-1"
        choices={[{ level: 1, service: "RecitalIndexing" }, { level: 1, service: "ExhibitIndexing" }]}
        onClose={vi.fn()}
        onComplete={vi.fn()}
        onError={onError}
        onJobEvent={vi.fn()}
        pageClass="title"
        pageCode="missing-page"
        segments={["reference"]}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Property Terms(Exhibit)" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith({
      error: {
        code: "page_segments_page_not_found",
        details: undefined,
        error: "Missing page",
        status: 404,
      },
      pageCode: "missing-page",
      session: "session-1",
    }));
    expect(screen.getByRole("checkbox", { name: "Property Terms(Exhibit)" })).toBeChecked();
    expect(screen.getByText(/Page segment update failed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("checkbox", { name: "Referance(Rectal)" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Property Terms(Exhibit)" })).not.toBeChecked();
  });

  it("fails without completion when the metadata cache update fails", async () => {
    const onComplete = vi.fn();
    const onError = vi.fn();
    const onJobEvent = vi.fn();
    const workerClient = {
      updatePageSegments: vi.fn(async () => undefined),
    };

    render(
      <PageSegmentsPanel
        apiGatewayUrl="https://doc.example.com"
        authToken="token-1"
        choices={[{ level: 1, service: "RecitalIndexing" }, { level: 1, service: "ExhibitIndexing" }]}
        onClose={vi.fn()}
        onComplete={onComplete}
        onError={onError}
        onJobEvent={onJobEvent}
        pageClass="title"
        pageCode="page-a"
        segments={["reference"]}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Property Terms(Exhibit)" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith({
      error: {
        code: undefined,
        details: undefined,
        error: "Metadata cache is not available.",
        status: undefined,
      },
      pageCode: "page-a",
      session: "session-1",
    }));
    expect(onComplete).not.toHaveBeenCalled();
    expect(onJobEvent.mock.calls.map(([event]) => event.phase)).toEqual(["started", "failed"]);
  });

  it("does not call package metadata fetch or worker on open", () => {
    const workerClient = {
      updatePageSegments: vi.fn(async () => undefined),
    };
    const fetchMock = vi.fn(async () => new Response("", { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);
    storeApi.getState().setJSON("session-1", splitMetadataJSON(metadata));

    render(
      <PageSegmentsPanel
        apiGatewayUrl="https://doc.example.com"
        authToken="token-1"
        choices={[{ level: 1, service: "RecitalIndexing" }]}
        onClose={vi.fn()}
        onComplete={vi.fn()}
        onError={vi.fn()}
        onJobEvent={vi.fn()}
        pageClass="blank"
        pageCode="page-a"
        segments={["reference"]}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    expect(workerClient.updatePageSegments).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: "Referance(Rectal)" })).toBeChecked();
  });

  it("preserves failure actions when parent rerenders from callback state", async () => {
    const workerClient = {
      updatePageSegments: vi.fn(async () => {
        throw Object.assign(new Error("Could not save page segments."), { code: "page_segments_page_not_found", status: 500 });
      }),
    };
    const onError = vi.fn();
    const Harness = () => {
      const [_message, setMessage] = useState("");
      return (
        <PageSegmentsPanel
          apiGatewayUrl="https://doc.example.com"
          authToken="token-1"
          choices={[{ level: 1, service: "RecitalIndexing" }, { level: 1, service: "ExhibitIndexing" }]}
          onClose={vi.fn()}
          onComplete={vi.fn()}
          onError={(event) => {
            setMessage(`error-${event.pageCode}`);
            onError(event);
          }}
          onJobEvent={vi.fn()}
          pageClass="blank"
          pageCode="page-a"
          segments={["reference"]}
          session="session-1"
          workerClient={workerClient}
        />
      );
    };

    storeApi.getState().setJSON("session-1", splitMetadataJSON(metadata));
    render(<Harness />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Property Terms(Exhibit)" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(screen.getByText(/Page segment update failed/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
