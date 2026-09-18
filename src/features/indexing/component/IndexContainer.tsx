import { QueueActions } from "../../queue/component/QueueActions";
import { useQueueStore } from "../../queue/store/queueStore";
import { useEffect, type JSX } from "react";
import { useMetadata } from "../../metdataview/hook/useMetadata";
import { MetadataPanel, type MetadataActionPayload, metadataStyles } from "aurora-core";
import type { MetdataMetadataProps } from "../../metdataview/type/metadataView.types";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { addIndexStoreApi } from "../../addindex";
import { editIndexStoreApi } from "../../editindex";

const emptyCodes = new Set<string>();

function loadingLabel(attempt: number, retryLimit: number): readonly string[] {
  return ["Retrieving metadata...", `Attempt ${attempt} of ${retryLimit}`];
}

export function IndexContainer(props: MetdataMetadataProps): JSX.Element {
  const { callbacks, children, segments, session } = props;
  const metadata = useMetadata(props);
  const tasks = useQueueStore((state) => state.tasks);
  const pendingChanges = new Map(tasks.filter((task) => task.session === session).flatMap((task) => task.changes.map((change) => [change.code, { kind: change.action === "drop" || change.patch?.action === "remove" ? "delete" as const : "update" as const, busy: task.status !== "failed", actions: task.status === "failed" ? <QueueActions id={task.id} code={change.code} /> : null }] as const)));
  const ready = metadata.store.status === "success" || metadata.store.status === "error";
  const loading = metadata.store.status === "loading";

  useEffect(() => {
    props.onReadyChange(ready);
  }, [props.onReadyChange, ready]);

  useEffect(() => {
    props.onLoaderChange?.(loading ? loadingLabel(metadata.retryAttempt, props.retryLimit) : null);
  }, [loading, metadata.retryAttempt, props.onLoaderChange, props.retryLimit]);
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
      <MetadataPanel
        onAddIndex={(segment) => addIndexStoreApi.getState().open({ segment })}
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
        sections={{
          filterByChoices: true,
          hiddenSegments: new Set(),
          showEmpty: false,
        }}
        showContext
        segments={segments}
        session={session}
        shortcuts={null}
        status={metadata.store.status}
        {...metadata}
      />
    </div>
  );
}
