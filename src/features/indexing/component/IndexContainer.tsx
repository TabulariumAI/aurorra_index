import { useEffect, type JSX } from "react";
import { useMetadata } from "../../metdataview/hook/useMetadata";
import { MetadataPanel } from "../../metdataview/component/MetadataPanel";
import type { MetdataActionPayload, MetdataMetadataProps } from "../../metdataview/type/metadataView.types";
import { metadataStyles } from "../../metdataview/style/metadataViewStyles";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";

function loadingLabel(attempt: number, retryLimit: number): readonly string[] {
  return ["Retrieving metadata...", `Attempt ${attempt} of ${retryLimit}`];
}

export function IndexContainer(props: MetdataMetadataProps): JSX.Element {
  const { batch, callbacks, children, segments, session } = props;
  const metadata = useMetadata(props);
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
      ? (payload: MetdataActionPayload) => {
          imageViewerStoreApi.getState().setRequest({
            code: payload.code,
            highlightOptions: { scroll: false },
            index: payload.type,
            metadataIndex: payload.metadataIndex ?? null,
            page: payload.page,
            quote: payload.quote ?? "",
            segment: payload.segment,
            session: payload.session,
            value: payload.value ?? "",
          });
          callbacks.onPageClick?.(payload);
        }
      : undefined,
  };

  return (
    <div style={metadataStyles.rootShell}>
      <MetadataPanel
        actions={{
          confirm: true,
          drop: true,
          refine: true,
          reprocess: true,
        }}
        batch={batch}
        callbacks={panelCallbacks}
        children={children}
        sections={{
          filterByChoices: true,
          hiddenSegments: new Set(),
          showEmpty: false,
        }}
        segments={segments}
        session={session}
        shortcuts={null}
        status={metadata.store.status}
        {...metadata}
      />
    </div>
  );
}
