import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatINRShort, CHART_COLORS } from "@/lib/format";
import { Wallet, AlertTriangle, CheckCircle2, Clock, Users, TrendingUp, Activity, Receipt } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";

const Card = ({ icon: Icon, label, value, sub, accent = "bg-[#0A3B2C]/10 text-[#0A3B2C]", testid }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow" data-testid={testid}>
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}><Icon className="w-4 h-4" /></div>
    </div>
    <p className="font-display text-2xl font-semibold mt-3">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setSummary(r.data));
    api.get("/dashboard/charts").then((r) => setCharts(r.data));
  }, []); // api is a module-level constant, stable across renders

  if (!summary || !charts) {
    return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight" data-testid="dashboard-title">Dashboard</h1>
        <p className="text-gray-500 mt-1">A calm view of your cashflow and recovery status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card icon={Receipt}    label="Total invoiced"      value={formatINRShort(summary.total_invoiced)} sub={`${summary.invoice_count} invoices`} testid="kpi-invoiced" />
        <Card icon={Clock}      label="Pending"             value={formatINRShort(summary.total_pending)}  sub={`${summary.overdue_count} overdue`} accent="bg-amber-100 text-amber-700" testid="kpi-pending" />
        <Card icon={AlertTriangle} label="Overdue amount"   value={formatINRShort(summary.total_overdue)}  sub={`avg delay ${summary.avg_delay_days}d`} accent="bg-orange-100 text-orange-700" testid="kpi-overdue" />
        <Card icon={CheckCircle2}  label="Recovered"        value={formatINRShort(summary.total_recovered)} sub={`${summary.collection_efficiency}% efficiency`} accent="bg-emerald-100 text-emerald-700" testid="kpi-recovered" />
        <Card icon={Users}      label="High-risk customers" value={summary.high_risk_count}                sub={`of ${summary.customer_count} total`} accent="bg-red-100 text-red-700" testid="kpi-highrisk" />
        <Card icon={Activity}   label="Avg payment delay"   value={`${summary.avg_delay_days} days`}        accent="bg-orange-100 text-orange-700" testid="kpi-delay" />
        <Card icon={TrendingUp} label="Collection rate"     value={`${summary.collection_efficiency}%`}     accent="bg-emerald-100 text-emerald-700" testid="kpi-collection" />
        <Card icon={Wallet}     label="Customers"           value={summary.customer_count}                  testid="kpi-customers" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Pending vs Recovered">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.pending_vs_recovered} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={2}>
                {charts.pending_vs_recovered.map((d, i) => <Cell key={d.name} fill={i === 0 ? "#0A3B2C" : "#F59E0B"} />)}
              </Pie>
              <Tooltip formatter={(v) => formatINR(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Invoice status distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={charts.status_distribution} dataKey="value" nameKey="name" outerRadius={90}>
                {charts.status_distribution.map((d, i) => <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly recovery trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={charts.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => formatINRShort(v).replace("₹","")} />
              <Tooltip formatter={(v) => formatINR(v)} />
              <Line type="monotone" dataKey="amount" stroke="#0A3B2C" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 5 overdue customers">
          {charts.top_overdue.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">No overdue customers — nicely done.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.top_overdue} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} tickFormatter={(v) => formatINRShort(v).replace("₹","")} />
                <YAxis type="category" dataKey="customer" stroke="#6B7280" fontSize={12} width={120} />
                <Tooltip formatter={(v) => formatINR(v)} />
                <Bar dataKey="amount" fill="#F97316" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Customer risk distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={charts.risk_distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {charts.risk_distribution.map((d, i) => {
                const col = d.name === "Low Risk" ? "#059669" : d.name === "Medium Risk" ? "#F59E0B" : d.name === "High Risk" ? "#F97316" : "#DC2626";
                return <Cell key={d.name} fill={col} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <h3 className="font-display text-lg font-medium mb-4">{title}</h3>
    {children}
  </div>
);
