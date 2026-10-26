import { LoadPlaceholder } from "aurora-core";
import { summarizeUsage, usageNames } from "../../usage/data/usageData";
import type { AuditReport } from "../type/audit.types";
import { auditStyles } from "../style/auditStyles";

export function AuditUsage({ report, session }: { report: AuditReport | null; session: string }) {
  if (report === null) return <LoadPlaceholder label="Loading service usage" />;
  if (!report.usage?.services?.length) return null;
  const usage = summarizeUsage(report.usage.services.map(service => ({ ...service, session })));
  return <section aria-label="Audit usage" style={auditStyles.usage}>
    <h3 style={auditStyles.usageTitle}>Service usage</h3>
    <table aria-label="Audit service usage" style={auditStyles.usageTable}>
      <thead><tr><th scope="col" style={auditStyles.serviceCell}>Service</th>
        {["Cost", "Time", "Pages"].map(label => <th scope="col" key={label} style={auditStyles.usageCell}>{label}</th>)}
      </tr></thead>
      <tbody>{usage.map(service => <tr key={service.name}>
        <th scope="row" style={auditStyles.serviceCell}>{usageNames[service.name]}</th>
        <td style={auditStyles.usageCell}>${service.cost.toFixed(4)}</td>
        <td style={auditStyles.usageCell}>{service.time === null ? null : `${service.time.toFixed(2)} s`}</td>
        <td style={auditStyles.usageCell}>{service.pages}</td>
      </tr>)}</tbody>
    </table>
  </section>;
}
