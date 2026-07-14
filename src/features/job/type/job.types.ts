export type JobName =
  | "audit.load"
  | "image.data"
  | "image.download"
  | "image.package"
  | "image.status"
  | "iq.ack"
  | "iq.load"
  | "iq.poll"
  | "iq.start"
  | "metadata.confirm"
  | "metadata.drop"
  | "metadata.load"
  | "metadata.reprocess"
  | "page-segments.update";

export type JobEvent = {
  job: JobName;
  jobId: string;
  message: string;
  session: string;
} & (
  | { phase: "started" | "completed" }
  | { error: string; phase: "failed" }
);

export type JobEventCallback = (event: JobEvent) => void;
