import { LoadPlaceholder, metadataStyles, segmentStyles, skeletonStyle } from "aurora-core";

export function IndexPlaceholder({ attempt, retryLimit }: { attempt: number; retryLimit: number }) {
  return (
    <section aria-label="Metadata" style={metadataStyles.root}>
      <div data-panel-scroll="true" style={metadataStyles.accordion}>
        <LoadPlaceholder label="Loading metadata">
          <div style={segmentStyles.header()}>
            <span style={metadataStyles.muted}>Loading metadata…</span>
            {attempt > 1 ? <span style={metadataStyles.muted}>Attempt {attempt} of {retryLimit}</span> : null}
          </div>
          <div aria-hidden="true">
            {["65%", "45%", "55%"].map(width => (
              <div key={width} style={segmentStyles.root}>
                <div style={segmentStyles.header()}>
                  <span style={{ ...skeletonStyle, width: "1.125rem", height: "1.125rem" }} />
                  <span style={{ ...skeletonStyle, width }} />
                </div>
                <div style={segmentStyles.content}>
                  {["90%", "70%", "80%"].map(width => <span key={width} style={{ ...skeletonStyle, width }} />)}
                </div>
              </div>
            ))}
          </div>
        </LoadPlaceholder>
      </div>
    </section>
  );
}
