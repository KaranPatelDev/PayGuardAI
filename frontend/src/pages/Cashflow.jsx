import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatINRShort } from "@/lib/format";
import { Calendar, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { InsightStrip, MetricCard, PageHeader } from "@/components/app/ProductUI";

export default function Cashflow() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/cashflow/forecast").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forecast"
        title="Cashflow forecast"
        description="Estimate what is likely to come in this week and month, with delayed recovery separated from healthier receivables."
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard icon={Calendar} label="Expected this week" value={formatINRShort(data.expected_this_week)} sub={formatINR(data.expected_this_week)} accent="bg-emerald-100 text-emerald-700" />
        <MetricCard icon={Calendar} label="Expected this month" value={formatINRShort(data.expected_this_month)} sub={formatINR(data.expected_this_month)} accent="bg-[#0A3B2C]/10 text-[#0A3B2C]" />
        <MetricCard icon={AlertTriangle} label="High-risk pending" value={formatINRShort(data.high_risk_pending)} sub={formatINR(data.high_risk_pending)} accent="bg-red-100 text-red-700" />
        <MetricCard icon={Activity} label="Likely delayed" value={formatINRShort(data.likely_delayed)} sub={formatINR(data.likely_delayed)} accent="bg-orange-100 text-orange-700" />
        <MetricCard icon={ArrowUpRight} label="Best-case recovery" value={formatINRShort(data.best_case_recovery)} sub={formatINR(data.best_case_recovery)} accent="bg-emerald-100 text-emerald-700" />
        <MetricCard icon={ArrowDownRight} label="Worst-case recovery" value={formatINRShort(data.worst_case_recovery)} sub={formatINR(data.worst_case_recovery)} accent="bg-amber-100 text-amber-700" />
      </div>
      <InsightStrip icon={TrendingUp} label="Forecast insight">
        If all medium-and-low-risk customers pay on time, you&apos;ll recover <span className="font-semibold">{formatINR(data.expected_this_month)}</span> this month. High-risk customers hold <span className="font-semibold">{formatINR(data.high_risk_pending)}</span>, so keep follow-ups specific and date-driven.
      </InsightStrip>
    </div>
  );
}
