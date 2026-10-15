import type { AuditUsageService } from "../../audit/type/audit.types";

export type UsageRecord = AuditUsageService & { session: string };

export type UsageFilters = {
  services: UsageRecord["name"][];
  from: string;
  to: string;
  period: "daily" | "weekly";
};

export type UsageSummary = {
  name: AuditUsageService["name"];
  cost: number;
  time: number | null;
  pages: number;
  sessions: number;
  average: number | null;
  points: { date: string; cost: number; pages: number }[];
};

export type UsageCommand = {
  owner: string;
  services: UsageRecord[];
  now: number;
};

export type UsageResult =
  | { ok: true; data: UsageRecord[] }
  | { ok: false; error: string };
