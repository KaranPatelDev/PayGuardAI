import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatINRShort } from "@/lib/format";
import { Calendar, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

const Tile = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}><Icon className="w-4 h-4" /></div></div>
    <p className="font-display text-3xl font-semibold mt-3">{value}</p>
    {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
  </div>
);

export default function Cashflow() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/cashflow/forecast").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="h-32 bg-gray-200 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight" data-testid="cashflow-title">Cashflow Forecast</h1>
        <p className="text-gray-500 mt-1">Smart estimates weighted by customer risk.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Tile icon={Calendar}   label="Expected this week"  value={formatINRShort(data.expected_this_week)}  sub={formatINR(data.expected_this_week)}  accent="bg-emerald-100 text-emerald-700" />
        <Tile icon={Calendar}   label="Expected this month" value={formatINRShort(data.expected_this_month)} sub={formatINR(data.expected_this_month)} accent="bg-[#0A3B2C]/10 text-[#0A3B2C]" />
        <Tile icon={AlertTriangle} label="High-risk pending"  value={formatINRShort(data.high_risk_pending)}  sub={formatINR(data.high_risk_pending)}   accent="bg-red-100 text-red-700" />
        <Tile icon={Activity}     label="Likely delayed"      value={formatINRShort(data.likely_delayed)}     sub={formatINR(data.likely_delayed)}      accent="bg-orange-100 text-orange-700" />
        <Tile icon={ArrowUpRight} label="Best-case recovery"  value={formatINRShort(data.best_case_recovery)} sub={formatINR(data.best_case_recovery)}  accent="bg-emerald-100 text-emerald-700" />
        <Tile icon={ArrowDownRight} label="Worst-case recovery" value={formatINRShort(data.worst_case_recovery)} sub={formatINR(data.worst_case_recovery)} accent="bg-amber-100 text-amber-700" />
      </div>
      <div className="bg-[#0A3B2C] rounded-xl p-6 text-white">
        <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /><p className="text-xs uppercase tracking-[0.2em] font-bold text-white/70">Forecast insight</p></div>
        <p className="mt-3 text-lg leading-relaxed">If all medium-and-low-risk customers pay on time, you&apos;ll recover <span className="font-semibold">{formatINR(data.expected_this_month)}</span> this month. High-risk customers hold <span className="font-semibold">{formatINR(data.high_risk_pending)}</span> — focus your follow-ups here.</p>
      </div>
    </div>
  );
}
