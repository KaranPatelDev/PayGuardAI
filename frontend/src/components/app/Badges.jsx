import { STATUS_STYLES, RISK_STYLES } from "../../lib/format";

export const StatusBadge = ({ status, testid }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Sent"];
  return (
    <span
      data-testid={testid || `status-badge-${status?.toLowerCase().replace(/\s+/g, "-")}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}
    >
      {status}
    </span>
  );
};

export const RiskBadge = ({ risk, testid }) => {
  const s = RISK_STYLES[risk] || RISK_STYLES["Low Risk"];
  return (
    <span
      data-testid={testid || `risk-badge-${risk?.toLowerCase().replace(/\s+/g, "-")}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {risk}
    </span>
  );
};
