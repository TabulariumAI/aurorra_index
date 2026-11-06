import { QueueActions } from "../../queue/component/QueueActions";
import { useQueueStore } from "../../queue/store/queueStore";
import type { JSX } from "react";
import { useMetadata } from "../../metdataview/hook/useMetadata";
import { type MetadataActionPayload, metadataStyles } from "aurora-core";
import { MetadataPanel } from "../../metdataview/component/MetadataPanel";
import type { MetadataProps } from "../../metdataview/type/metadataView.types";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { addIndexStoreApi } from "../../addindex";
import { editIndexStoreApi } from "../../editindex";
import { IndexPlaceholder } from "./IndexPlaceholder";

const emptyCodes = new Set<string>();

export function IndexContainer(props: MetadataProps): JSX.Element {
  const { callbacks, children, segments, session } = props;
  const metadata = useMetadata(props);
  const tasks = useQueueStore((state) => state.tasks);
  const pendingChanges = new Map(tasks.filter((task) => task.session === session).flatMap((task) => task.changes.filter(change => change.action !== "reprocess").map((change) => [change.code, { kind: change.action === "drop" || change.patch?.action === "remove" ? "delete" as const : "update" as const, busy: task.status !== "failed", actions: task.status === "failed" ? <QueueActions id={task.id} code={change.code} /> : null }] as const)));
  const pendingSegments = new Map(tasks.filter(task => task.session === session && task.changes.some(change => change.action === "reprocess"))
    .map(task => [task.segment, { busy: task.status !== "failed", actions: task.status === "failed" ? <QueueActions id={task.id} /> : null }] as const));
  const panelCallbacks = {
    ...callbacks,
    onPageClick: callbacks.onPageClick
      ? (payload: MetadataActionPayload) => {
          const highlightOptions = { scroll: false };
          imageViewerStoreApi.getState().setRequest({
            code: payload.code,
            highlightOptions,
            index: payload.type,
            metadataIndex: payload.metadataIndex ?? null,
            page: payload.page,
            quote: payload.quote ?? "",
            segment: payload.segment,
            session: payload.session,
            value: payload.value ?? "",
          });
          callbacks.onPageClick?.({ ...payload, highlightOptions });
        }
      : undefined,
  };

  return (
    <div style={metadataStyles.rootShell}>
      {!metadata.metadata && (metadata.store.status === "idle" || metadata.store.status === "loading") ? (
        <IndexPlaceholder key={session} attempt={metadata.retryAttempt} retryLimit={props.retryLimit} />
      ) : <MetadataPanel
        onAddIndex={(segment, anchor) => {
          addIndexStoreApi.getState().open({ segment });
          callbacks.onAddIndex?.(anchor);
        }}
        onEditIndex={(index, segment, anchor) => {
          editIndexStoreApi.getState().open({ index, segment, session });
          callbacks.onEditIndex?.(index, segment, anchor);
        }}
        actions={{
          confirm: true,
          drop: true,
          reprocess: true,
        }}
        callbacks={panelCallbacks}
        children={children}
        headerActions={props.headerActions}
        confirmedCodes={emptyCodes}
        removedCodes={emptyCodes}
        pendingChanges={pendingChanges}
        pendingSegments={pendingSegments}
        sections={{
          filterByChoices: true,
          hiddenSegments: new Set(),
          showEmpty: false,
        }}
        showContext
        pageScope={props.pageScope}
        segments={segments}
        session={session}
        shortcuts={null}
        status={metadata.store.status}
        {...metadata}
      />}
    </div>
  );
}
