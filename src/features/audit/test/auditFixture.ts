export const auditPatch = {
  code: null,
  solution: "add",
  field: "",
  explanation: "Index created by user.",
  identifier: null,
  value: "2026-001",
  label: "Recording number",
  aspect: "recording_number",
  ambiguous: null,
  source: "Recorded as 2026-001",
  page: "7",
  segment: "transaction",
  owner: "RefineManager",
};

export const auditGap = {
  solution: "add",
  explanation: "Index created by user.",
  page: "7",
  owner: "User",
  timestamp: "2026-10-03T15:30:00Z",
  segment: "transaction",
  patch: auditPatch,
};
