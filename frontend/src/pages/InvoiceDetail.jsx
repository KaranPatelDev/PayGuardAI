import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, CheckCircle2, Clock, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, RiskBadge } from "@/components/app/Badges";

const KV = ({ label, value }) => (
  <div><p className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">{label}</p><p className="text-sm font-medium text-gray-900 mt-1">{value}</p></div>
);

const Panel = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5"><h4 className="font-display text-lg font-medium mb-3">{title}</h4><div className="space-y-3">{children}</div></div>
);

function InvoiceHeader({ inv }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">Invoice</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight" data-testid="invoice-number">{inv.invoice_number}</h1>
          {inv.customer && <Link to={`/app/customers/${inv.customer.id}`} className="text-gray-600 hover:text-[#0A3B2C]">{inv.customer.business_name}</Link>}
          <div className="flex flex-wrap gap-2 mt-3"><StatusBadge status={inv.status} />{inv.customer && <RiskBadge risk={inv.customer.risk_category} />}</div>
        </div>
        <div className="sm:text-right shrink-0">
          <p className="font-display text-2xl sm:text-3xl font-semibold">{formatINR(inv.pending_amount)}</p>
          <p className="text-xs text-gray-500">pending of {formatINR(inv.total_amount)}</p>
          {inv.overdue_days > 0 && <p className="text-sm text-orange-600 mt-1">{inv.overdue_days} days overdue</p>}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <KV label="Invoice date" value={formatDate(inv.invoice_date)} />
        <KV label="Due date" value={formatDate(inv.due_date)} />
        <KV label="Total" value={formatINR(inv.total_amount)} />
        <KV label="Paid" value={formatINR(inv.paid_amount)} />
        <KV label="Tax" value={formatINR(inv.tax_amount)} />
        <KV label="Description" value={inv.description || "—"} />
      </div>
    </div>
  );
}

function PaymentDialog({ payOpen, setPayOpen, pay, setPay, onSave }) {
  return (
    <Dialog open={payOpen} onOpenChange={setPayOpen}>
      <DialogTrigger asChild><Button variant="outline" data-testid="btn-add-payment"><Plus className="w-4 h-4 mr-2" /> Add payment</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>Enter the payment details to update this invoice's pending amount.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Amount (₹)</Label><Input type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: +e.target.value })} data-testid="pay-amount" /></div>
          <div><Label>Date</Label><Input type="date" value={pay.payment_date} onChange={(e) => setPay({ ...pay, payment_date: e.target.value })} /></div>
          <div><Label>Mode</Label>
            <Select value={pay.payment_mode} onValueChange={(v) => setPay({ ...pay, payment_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["UPI","Bank Transfer","Cash","Cheque","Card","Other"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Reference / UTR</Label><Input value={pay.reference_number} onChange={(e) => setPay({ ...pay, reference_number: e.target.value })} /></div>
        </div>
        <Button onClick={onSave} data-testid="pay-save-btn" className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white">Save payment</Button>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceActions({ inv, id, payOpen, setPayOpen, pay, setPay, onAddPayment, onMarkPaid, onSetStatus }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link to="/app/followups" state={{ invoiceId: id }}><Button className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white" data-testid="btn-generate-followup"><Sparkles className="w-4 h-4 mr-2" /> Generate AI follow-up</Button></Link>
      <PaymentDialog payOpen={payOpen} setPayOpen={setPayOpen} pay={pay} setPay={setPay} onSave={onAddPayment} />
      {inv.pending_amount > 0 && <Button variant="outline" onClick={onMarkPaid} data-testid="btn-mark-paid">Mark fully paid</Button>}
      {inv.status !== "Disputed" && <Button variant="outline" onClick={() => onSetStatus("Disputed")}>Mark disputed</Button>}
      {inv.status !== "Escalated" && <Button variant="outline" onClick={() => onSetStatus("Escalated")}>Escalate</Button>}
    </div>
  );
}

function RecoveryTimeline({ timeline }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-display text-xl font-medium mb-4">Smart Recovery Timeline</h3>
      <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
        {timeline.map((t) => {
          const Icon = t.status === "completed" ? CheckCircle2 : t.status === "due" ? Clock : Circle;
          const color = t.status === "completed" ? "text-emerald-600" : t.status === "due" ? "text-orange-600" : "text-gray-300";
          return (
            <li key={t.offset_days} className="pl-6">
              <span className={`absolute -left-[11px] w-5 h-5 bg-white ${color}`}><Icon className="w-5 h-5" /></span>
              <div className="flex justify-between flex-wrap gap-2"><p className="font-medium text-gray-900">{t.action}</p><p className="text-xs text-gray-500">{formatDate(t.date)}</p></div>
              <p className="text-sm text-gray-500 mt-1">{t.description}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PaymentHistory({ payments }) {
  return (
    <Panel title="Payments">
      {payments.length === 0 ? <p className="text-sm text-gray-400">No payments recorded.</p> : payments.map(p => (
        <div key={p.id} className="border-b border-gray-100 pb-2 last:border-0 flex justify-between"><div><p className="text-sm font-medium">{formatINR(p.amount)}</p><p className="text-xs text-gray-500">{p.payment_mode} · {formatDate(p.payment_date)}</p></div><span className="text-xs text-gray-400">{p.reference_number}</span></div>
      ))}
    </Panel>
  );
}

function FollowupList({ followups }) {
  return (
    <Panel title={`Follow-ups (${followups.length})`}>
      {followups.length === 0 ? <p className="text-sm text-gray-400">No follow-ups yet.</p> : followups.map(f => (
        <div key={f.id} className="border-b border-gray-100 pb-2 last:border-0">
          <div className="flex justify-between"><span className="text-xs font-medium">{f.followup_type} · {f.channel}</span><span className="text-xs text-gray-400">{formatDate(f.created_at)}</span></div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{f.message}</p>
          <p className="text-xs text-[#0A3B2C] mt-1">Status: {f.status}</p>
        </div>
      ))}
    </Panel>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [payOpen, setPayOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [pay, setPay] = useState({ amount: 0, payment_date: today, payment_mode: "UPI", reference_number: "", notes: "" });

  const load = useCallback(async () => {
    const { data } = await api.get(`/invoices/${id}`); setInv(data);
    const t = await api.get(`/invoices/${id}/timeline`); setTimeline(t.data.timeline);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const markPaid = async () => {
    await api.post(`/invoices/${id}/mark-paid`); toast.success("Marked as paid"); load();
  };

  const addPayment = async () => {
    if (!pay.amount || pay.amount <= 0) return toast.error("Enter a valid amount");
    await api.post("/payments", { invoice_id: id, ...pay }); toast.success("Payment added");
    setPayOpen(false); setPay({ amount: 0, payment_date: today, payment_mode: "UPI", reference_number: "", notes: "" });
    load();
  };

  const setStatus = async (s) => { await api.put(`/invoices/${id}`, { status: s }); toast.success(`Marked ${s}`); load(); };

  if (!inv) return <div className="h-32 bg-gray-200 animate-pulse rounded-xl" />;

  return (
    <div className="space-y-6">
      <Link to="/app/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-[#0A3B2C]"><ArrowLeft className="w-4 h-4 mr-1" /> Back to invoices</Link>

      <InvoiceHeader inv={inv} />
      <InvoiceActions inv={inv} id={id} payOpen={payOpen} setPayOpen={setPayOpen} pay={pay} setPay={setPay} onAddPayment={addPayment} onMarkPaid={markPaid} onSetStatus={setStatus} />
      <RecoveryTimeline timeline={timeline} />

      <div className="grid md:grid-cols-2 gap-6">
        <PaymentHistory payments={inv.payments} />
        <FollowupList followups={inv.followups} />
      </div>
    </div>
  );
}
