import type { JSX } from "react";
import { useMetadata } from "../../metdata/hook/useMetadata";
import { MetadataPanel } from "../../metdata/component/MetadataPanel";
import type { IndexMetadataProps } from "../../metdata/type/metadata.types";
import { metadataStyles } from "../../metdata/style/metadataStyles";
import { IndexProgress } from "./IndexProgress";

export function IndexContainer(props: IndexMetadataProps): JSX.Element {
  const { callbacks, choices, children, segments, session } = props;
  const metadata = useMetadata(props);

  return (
    <div style={metadataStyles.rootShell}>
      <IndexProgress visible={metadata.store.status === "loading"} />
      <MetadataPanel callbacks={callbacks} choices={choices} children={children} segments={segments} session={session} {...metadata} />
    </div>
  );
}
