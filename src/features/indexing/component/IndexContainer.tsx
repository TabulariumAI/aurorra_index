import { useEffect, type JSX } from "react";
import { useMetadata } from "../../metdata/hook/useMetadata";
import { MetadataPanel } from "../../metdata/component/MetadataPanel";
import type { IndexActionPayload, IndexMetadataProps } from "../../metdata/type/metadata.types";
import { metadataStyles } from "../../metdata/style/metadataStyles";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";

const loadingLabel = "Retrieving metadata...";

export function IndexContainer(props: IndexMetadataProps): JSX.Element {
  const { callbacks, choices, children, segments, session } = props;
  const metadata = useMetadata(props);
  const ready = metadata.store.status === "success" || metadata.store.status === "error";
  const loading = metadata.store.status === "loading";

  useEffect(() => {
    props.onReadyChange(ready);
  }, [props.onReadyChange, ready]);

  useEffect(() => {
    props.onLoaderChange?.(loading ? [loadingLabel] : null);
  }, [loading, props.onLoaderChange]);
  const panelCallbacks = {
    ...callbacks,
    onPageClick: callbacks.onPageClick
      ? (payload: IndexActionPayload) => {
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
      {!loading ? <MetadataPanel
        actions={{
          confirm: true,
          drop: true,
          refine: true,
          reprocess: true,
        }}
        callbacks={panelCallbacks}
        choices={choices}
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
      /> : null}
    </div>
  );
}
