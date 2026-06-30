import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatINRShort, CHART_COLORS } from "@/lib/format";
import { Wallet, AlertTriangle, CheckCircle2, Clock, Users, TrendingUp, Activity, Receipt } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { InsightStrip, MetricCard, PageHeader, Surface } from "@/components/app/ProductUI";

const Kpi = ({ testid, ...props }) => (
  <div data-testid={testid}>
    <MetricCard {...props} />
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
    return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />)}</div>;
  }

  const riskShare = summary.customer_count ? Math.round((summary.high_risk_count / summary.customer_count) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Today"
        title="Recovery dashboard"
        description="See which invoices are blocking cashflow, where follow-ups should go next, and how much has already been recovered."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Kpi icon={Receipt} label="Invoiced value" value={formatINRShort(summary.total_invoiced)} sub={`${summary.invoice_count} invoices in recovery`} testid="kpi-invoiced" />
        <Kpi icon={Clock} label="Still pending" value={formatINRShort(summary.total_pending)} sub={`${summary.overdue_count} invoices need attention`} accent="bg-amber-100 text-amber-700" testid="kpi-pending" />
        <Kpi icon={AlertTriangle} label="Overdue exposure" value={formatINRShort(summary.total_overdue)} sub={`Average delay is ${summary.avg_delay_days} days`} accent="bg-orange-100 text-orange-700" testid="kpi-overdue" />
        <Kpi icon={CheckCircle2} label="Recovered cash" value={formatINRShort(summary.total_recovered)} sub={`${summary.collection_efficiency}% collection efficiency`} accent="bg-emerald-100 text-emerald-700" testid="kpi-recovered" />
        <Kpi icon={Users} label="Risky accounts" value={summary.high_risk_count} sub={`${riskShare}% of your customer base`} accent="bg-red-100 text-red-700" testid="kpi-highrisk" />
        <Kpi icon={Activity} label="Payment delay" value={`${summary.avg_delay_days} days`} sub="Average delay across paid invoices" accent="bg-orange-100 text-orange-700" testid="kpi-delay" />
        <Kpi icon={TrendingUp} label="Recovery rate" value={`${summary.collection_efficiency}%`} sub="Recovered vs invoiced amount" accent="bg-emerald-100 text-emerald-700" testid="kpi-collection" />
        <Kpi icon={Wallet} label="Customer ledger" value={summary.customer_count} sub="Customers with invoice history" testid="kpi-customers" />
      </div>

      <InsightStrip icon={AlertTriangle} label="Recommended focus" tone={summary.total_overdue > 0 ? "warning" : "neutral"}>
        {summary.total_overdue > 0 ? (
          <>Prioritize the <strong>{formatINR(summary.total_overdue)}</strong> overdue bucket first. Customers with repeated delay should receive a firmer reminder and a clear payment date request.</>
        ) : (
          <>No overdue amount is currently reported. Keep adding invoice due dates so PayGuard can surface risk before payments slip.</>
        )}
      </InsightStrip>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Cash locked vs recovered">
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

        <ChartCard title="Invoice workload by status">
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

        <ChartCard title="Monthly recovery movement">
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

        <ChartCard title="Largest overdue accounts">
          {charts.top_overdue.length === 0 ? (
            <p className="text-sm text-gray-500 py-12 text-center">No overdue customers. New delayed payments will appear here automatically.</p>
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

      <ChartCard title="Customer risk mix">
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
  <Surface className="p-5">
    <h3 className="font-display text-lg font-medium mb-4">{title}</h3>
    {children}
  </Surface>
);
