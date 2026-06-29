import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { ArrowLeft, Sparkles, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskBadge, StatusBadge } from "@/components/app/Badges";

export default function CustomerDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => { api.get(`/customers/${id}`).then((r) => setC(r.data)); }, [id]);

  const genReport = async () => {
    setLoadingReport(true);
    try {
      const { data } = await api.post("/ai/generate-recovery-report", { customer_id: id });
      setReport(data);
    } finally { setLoadingReport(false); }
  };

  if (!c) return <div className="h-32 bg-gray-200 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-6">
      <Link to="/app/customers" className="inline-flex items-center text-sm text-gray-500 hover:text-[#0A3B2C]"><ArrowLeft className="w-4 h-4 mr-1" /> Back to customers</Link>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight" data-testid="customer-name">{c.business_name}</h1>
            <p className="text-gray-500 mt-1">{c.contact_person}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{c.phone}</span>}
              {c.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</span>}
              {(c.city || c.state) && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{c.city}, {c.state}</span>}
            </div>
          </div>
          <div className="text-right">
            <RiskBadge risk={c.risk_category} />
            <p className="text-3xl font-display font-semibold mt-3">{formatINR(c.total_pending)}</p>
            <p className="text-xs text-gray-500">total pending</p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-gradient-to-br from-[#0A3B2C]/5 to-transparent rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-bold text-[#0A3B2C]"><Sparkles className="w-3.5 h-3.5" /> AI Risk Score: {c.risk_score}/100</div>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">{c.risk_reason}</p>
          <p className="text-sm text-gray-900 mt-2 font-medium">Suggested: {c.risk_action}</p>
        </div>

        <Button data-testid="generate-customer-report-btn" onClick={genReport} disabled={loadingReport} className="mt-4 bg-[#0A3B2C] hover:bg-[#072A1F] text-white">
          <Sparkles className="w-4 h-4 mr-2" /> {loadingReport ? "Generating…" : "Generate AI Recovery Report"}
        </Button>
        {report && (
          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">Recovery Report</h3>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(report.report); /* eslint-disable-next-line */ import('sonner').then(m => m.toast.success('Copied')); }}>Copy</Button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{report.report}</pre>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-xl font-medium mb-3">Invoices</h3>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-5 py-3 font-medium">Invoice</th><th className="text-left px-5 py-3 font-medium">Due</th><th className="text-left px-5 py-3 font-medium">Amount</th><th className="text-left px-5 py-3 font-medium">Pending</th><th className="text-left px-5 py-3 font-medium">Status</th></tr></thead>
            <tbody>
              {c.invoices.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">No invoices</td></tr> :
                c.invoices.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-5 py-3"><Link className="font-medium text-gray-900 hover:text-[#0A3B2C]" to={`/app/invoices/${i.id}`}>{i.invoice_number}</Link></td>
                    <td className="px-5 py-3">{formatDate(i.due_date)}</td>
                    <td className="px-5 py-3">{formatINR(i.total_amount)}</td>
                    <td className="px-5 py-3 font-medium">{formatINR(i.pending_amount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display text-xl font-medium mb-3">Payments</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            {c.payments.length === 0 ? <p className="text-sm text-gray-400">No payments yet.</p> : c.payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                <div><p className="text-sm font-medium">{formatINR(p.amount)}</p><p className="text-xs text-gray-500">{p.payment_mode} · {formatDate(p.payment_date)}</p></div>
                <span className="text-xs text-gray-400">{p.reference_number}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-xl font-medium mb-3">Follow-up history</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 max-h-96 overflow-y-auto">
            {c.followups.length === 0 ? <p className="text-sm text-gray-400">No follow-ups yet.</p> : c.followups.map((f) => (
              <div key={f.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-center"><span className="text-xs font-medium text-gray-700">{f.followup_type} · {f.channel}</span><span className="text-xs text-gray-400">{formatDate(f.created_at)}</span></div>
                <p className="text-sm mt-1 text-gray-600 line-clamp-2">{f.message}</p>
                <p className="text-xs mt-1.5 text-[#0A3B2C] font-medium">Status: {f.status}{f.customer_response ? ` · "${f.customer_response}"` : ""}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
