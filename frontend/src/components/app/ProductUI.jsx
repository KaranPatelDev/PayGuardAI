import { ArrowUpRight } from "lucide-react";

export const PageHeader = ({ eyebrow, title, description, action, children }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-3xl">
      {eyebrow && <p className="text-xs uppercase tracking-[0.16em] font-bold text-[#0A3B2C]">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-semibold tracking-normal text-gray-950" data-testid={title ? `${title.toLowerCase().replace(/\s+/g, "-")}-heading` : undefined}>
        {title}
      </h1>
      {description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{description}</p>}
      {children}
    </div>
    {action}
  </div>
);

export const Surface = ({ children, className = "" }) => (
  <div className={`pg-surface rounded-lg ${className}`}>{children}</div>
);

export const MetricCard = ({ icon: Icon, label, value, sub, accent = "bg-[#0A3B2C]/10 text-[#0A3B2C]", trend }) => (
  <Surface className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.14em] font-bold text-gray-500">{label}</p>
        <p className="font-display text-2xl font-semibold text-gray-950 mt-3">{value}</p>
      </div>
      {Icon && <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}><Icon className="w-4 h-4" /></div>}
    </div>
    {(sub || trend) && (
      <div className="mt-3 flex items-center justify-between gap-3">
        {sub && <p className="text-xs text-gray-500 leading-relaxed">{sub}</p>}
        {trend && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ArrowUpRight className="w-3.5 h-3.5" />{trend}</span>}
      </div>
    )}
  </Surface>
);

export const InsightStrip = ({ icon: Icon, label, children, tone = "primary" }) => {
  const tones = {
    primary: "bg-[#0A3B2C] text-white",
    warning: "bg-amber-50 text-amber-950 border border-amber-200",
    neutral: "bg-white text-gray-900 border border-gray-200",
  };

  return (
    <div className={`rounded-lg p-5 ${tones[tone] || tones.primary}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label && <p className="text-xs uppercase tracking-[0.16em] font-bold opacity-70">{label}</p>}
      </div>
      <div className="mt-3 text-sm sm:text-base leading-relaxed">{children}</div>
    </div>
  );
};
