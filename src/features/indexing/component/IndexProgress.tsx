import { ProgressBar } from "aurorra-ui";
import type { JSX } from "react";
import { metadataStyles } from "../../metdata/style/metadataStyles";

export function IndexProgress({ visible }: { visible: boolean }): JSX.Element | null {
  if (!visible) return null;

  return (
    <div style={metadataStyles.progressOverlay}>
      <ProgressBar
        ariaLabel="Metadata progress"
        continuous
        durationMs={10000}
        label="Retrieving metadata..."
        running
        showText={false}
        visible
      />
    </div>
  );
}
