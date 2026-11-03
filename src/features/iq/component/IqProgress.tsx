import { useEffect, useState } from "react";
import { ProgressView } from "aurora-core";

const IQ_STEPS = [
  { jobId: "iq-segments", message: "Checking segment quality…" },
  { jobId: "iq-gates", message: "Checking compliance gates…" },
  { jobId: "iq-generation", message: "Generating IQ report…" },
];

export function IqProgress({ intervalMs }: { intervalMs: number }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step === IQ_STEPS.length - 1) return;
    const timer = window.setTimeout(() => setStep(step + 1), intervalMs);
    return () => window.clearTimeout(timer);
  }, [intervalMs, step]);

  return (
    <ProgressView autoScroll={true} highlightLast={true}
      fillCompletion={false}
      intro="I’ll keep you updated as I generate the IQ report."
      jobs={IQ_STEPS.slice(0, step + 1).map((job, index) => ({
        ...job,
        phase: index < step ? "completed" : "started",
      }))}
      process="GENERATING IQ REPORT"
    />
  );
}
