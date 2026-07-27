import type { JSX } from "react";
import { useMetadata } from "../../metdata/hook/useMetadata";
import { MetadataPanel } from "../../metdata/component/MetadataPanel";
import type { IndexActionPayload, IndexMetadataProps } from "../../metdata/type/metadata.types";
import { metadataStyles } from "../../metdata/style/metadataStyles";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { IndexProgress } from "./IndexProgress";

export function IndexContainer(props: IndexMetadataProps): JSX.Element {
  const { callbacks, choices, children, segments, session } = props;
  const metadata = useMetadata(props);
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
      <IndexProgress visible={metadata.store.status === "loading"} />
      <MetadataPanel
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
      />
    </div>
  );
}
