export const formatINR = (amount) => {
  const n = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

export const formatINRShort = (amount) => {
  const n = Number(amount || 0);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return formatINR(n);
};

export const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

export const STATUS_STYLES = {
  Draft:           { bg: "bg-gray-100",    text: "text-gray-700",    border: "border-gray-200"  },
  Sent:            { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200"  },
  "Due Soon":      { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200" },
  "Due Today":     { bg: "bg-amber-50",    text: "text-amber-800",   border: "border-amber-300" },
  Overdue:         { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200"},
  "Partially Paid":{ bg: "bg-sky-50",      text: "text-sky-700",     border: "border-sky-200"   },
  Paid:            { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200"},
  Disputed:        { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200"   },
  Escalated:       { bg: "bg-red-100",     text: "text-red-800",     border: "border-red-300"   },
};

export const RISK_STYLES = {
  "Low Risk":      { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  "Medium Risk":   { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  "High Risk":     { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500"  },
  "Critical Risk": { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
};

export const CHART_COLORS = ["#0A3B2C", "#5B8C7B", "#F59E0B", "#F97316", "#DC2626", "#2563EB"];
