import * as Popover from "@radix-ui/react-popover";
import { ConfButton, Icon } from "aurora-core";
import { useQueueStore } from "../store/queueStore";
import { queueStyles } from "../style/queueStyles";

export function QueueActions({ id, code }: { id: string; code?: string }) {
  const task = useQueueStore((state) => state.tasks.find((task) => task.id === id));
  const retry = useQueueStore((state) => state.retry);
  const cancel = useQueueStore((state) => state.cancel);
  if (!task || task.status !== "failed") return null;
  return <div style={queueStyles.recovery}>
    <ConfButton aria-label="Retry change" onConfirm={() => void retry(id)} requireConfirmation={false} showPrompt={false} flat size="sm" style={queueStyles.button}><Icon name="refresh" />Retry</ConfButton>
    {task.changes.slice(task.cursor).some((change) => change.action === "reprocess" ? code === undefined : change.code === code) ? <>
      <span aria-hidden="true" style={queueStyles.separator} />
      <ConfButton aria-label="Cancel change" onConfirm={() => cancel(id, code)} requireConfirmation={false} showPrompt={false} flat size="sm" style={queueStyles.button}><Icon name="close" />Cancel</ConfButton>
    </> : null}
    {task.error ? <>
      <div role="alert" style={queueStyles.announcement}>{task.error}</div>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button aria-label="Error details" style={queueStyles.info} type="button"><Icon name="info" /></button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content aria-label="Error details" side="top" align="end" sideOffset={8} collisionPadding={8} style={queueStyles.callout}>
            <span style={queueStyles.errorIcon}><Icon name="alert" /></span>
            <div style={queueStyles.message}>
              <strong>{task.error}</strong>
              <p style={queueStyles.description}>The request could not be completed. Please retry.</p>
            </div>
            <Popover.Arrow width={16} height={8} style={queueStyles.arrow} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </> : null}
  </div>;
}
