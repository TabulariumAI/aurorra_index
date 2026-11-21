import { choicesStyles, CreditValue, LoadPlaceholder, skeletonStyle } from "aurora-core";
import { summarizeUsage, usageNames } from "../../usage/data/usageData";
import type { AuditReport } from "../type/audit.types";
import { auditStyles } from "../style/auditStyles";

export function AuditUsage({ report, session }: { report: AuditReport | null; session: string }) {
  if (report === null) return <LoadPlaceholder label="Loading service usage"><section style={auditStyles.usage}>
    <h3 style={choicesStyles.heading}>Service usage</h3>
    <div aria-label="Service usage table" role="region" tabIndex={0} style={choicesStyles.tableFrame}>
    <table aria-label="Audit service usage" style={auditStyles.usageTable}>
      <thead style={choicesStyles.tableHead}><tr><th scope="col" style={choicesStyles.cell}>Service</th>{["Credits", "Time", "Pages"].map(label => <th scope="col" key={label} style={auditStyles.usageCell}>{label}</th>)}</tr></thead>
      <tbody aria-hidden="true">{[0, 1, 2].map(row => <tr key={row}>{[0, 1, 2, 3].map(column => <td key={column} style={column === 0 ? auditStyles.serviceCell : auditStyles.usageCell}><span style={{ ...skeletonStyle, width: column === 0 ? "70%" : "2rem" }} /></td>)}</tr>)}</tbody>
    </table>
    </div>
  </section></LoadPlaceholder>;
  if (!report.usage?.services?.length) return null;
  const usage = summarizeUsage(report.usage.services.map(service => ({ ...service, session })));
  return <section aria-label="Audit usage" style={auditStyles.usage}>
    <h3 style={choicesStyles.heading}>Service usage</h3>
    <div aria-label="Service usage table" role="region" tabIndex={0} style={choicesStyles.tableFrame}>
    <table aria-label="Audit service usage" style={auditStyles.usageTable}>
      <thead style={choicesStyles.tableHead}><tr><th scope="col" style={choicesStyles.cell}>Service</th>
        {["Credits", "Time", "Pages"].map(label => <th scope="col" key={label} style={auditStyles.usageCell}>{label}</th>)}
      </tr></thead>
      <tbody>{usage.map(service => <tr key={service.name}>
        <th scope="row" style={auditStyles.serviceCell}>{usageNames[service.name]}</th>
        <td style={auditStyles.usageCell}><CreditValue value={service.cost} /></td>
        <td style={auditStyles.usageCell}>{service.time === null ? null : `${service.time.toFixed(2)} s`}</td>
        <td style={auditStyles.usageCell}>{service.pages}</td>
      </tr>)}</tbody>
    </table>
    </div>
  </section>;
}
