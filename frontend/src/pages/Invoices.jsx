import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Search, Trash2, FileText as FileTextIcon, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, RiskBadge } from "@/components/app/Badges";
import EmptyState from "@/components/app/EmptyState";

const STATUSES = ["All","Draft","Sent","Due Soon","Due Today","Overdue","Partially Paid","Paid","Disputed","Escalated"];

function InvoiceFilters({ search, setSearch, status, setStatus }) {
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input data-testid="inv-search" placeholder="Search invoice number…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger data-testid="inv-status-filter" className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function InvoiceTable({ list, onDelete }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr><th className="text-left px-5 py-3 font-medium">Invoice</th><th className="text-left px-5 py-3 font-medium">Customer</th><th className="text-left px-5 py-3 font-medium">Due</th><th className="text-left px-5 py-3 font-medium">Total</th><th className="text-left px-5 py-3 font-medium">Pending</th><th className="text-left px-5 py-3 font-medium">Status</th><th className="text-left px-5 py-3 font-medium">Risk</th><th /></tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No invoices match your filters</td></tr> :
                list.map((i) => (
                  <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50/60" data-testid={`invoice-row-${i.id}`}>
                    <td className="px-5 py-3"><Link className="font-medium text-gray-900 hover:text-[#0A3B2C]" to={`/app/invoices/${i.id}`}>{i.invoice_number}</Link></td>
                    <td className="px-5 py-3 text-gray-700">{i.customer_name}</td>
                    <td className="px-5 py-3">{formatDate(i.due_date)}{i.overdue_days > 0 && <p className="text-xs text-orange-600 mt-0.5">{i.overdue_days}d overdue</p>}</td>
                    <td className="px-5 py-3">{formatINR(i.total_amount)}</td>
                    <td className="px-5 py-3 font-medium">{formatINR(i.pending_amount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-5 py-3"><RiskBadge risk={i.customer_risk} /></td>
                    <td className="px-5 py-3"><button onClick={() => onDelete(i.id)} className="p-2 hover:bg-red-50 rounded-lg" data-testid={`delete-invoice-${i.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {list.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No invoices match your filters</div>
        ) : list.map((i) => (
          <div key={i.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3" data-testid={`invoice-card-${i.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link className="font-medium text-gray-900 hover:text-[#0A3B2C] block truncate" to={`/app/invoices/${i.id}`}>{i.invoice_number}</Link>
                <p className="text-xs text-gray-500 mt-0.5">{i.customer_name}</p>
              </div>
              <StatusBadge status={i.status} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Due</p>
                <p className="font-medium">{formatDate(i.due_date)}</p>
                {i.overdue_days > 0 && <p className="text-xs text-orange-600">{i.overdue_days}d overdue</p>}
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-medium">{formatINR(i.total_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="font-medium">{formatINR(i.pending_amount)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <RiskBadge risk={i.customer_risk} />
              <button onClick={() => onDelete(i.id)} className="p-2 hover:bg-red-50 rounded-lg" data-testid={`delete-invoice-${i.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CreateInvoiceDialog({ open, setOpen, customers, onCreated }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ customer_id: "", invoice_number: "", invoice_date: today, due_date: today, amount: 0, tax_amount: 0, description: "" });
  const [ocrLoading, setOcrLoading] = useState(false);

  const create = async () => {
    if (!form.customer_id || !form.invoice_number) return toast.error("Customer and invoice number are required");
    try {
      await api.post("/invoices", form);
      toast.success("Invoice created");
      setOpen(false);
      setForm({ customer_id: "", invoice_number: "", invoice_date: today, due_date: today, amount: 0, tax_amount: 0, description: "" });
      onCreated();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const onOcrUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/ai/parse-invoice", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({
        ...f,
        customer_id: data.matched_customer_id || f.customer_id,
        invoice_number: data.invoice_number || f.invoice_number,
        invoice_date: data.invoice_date || f.invoice_date,
        due_date: data.due_date || f.due_date,
        amount: Number(data.amount) || f.amount,
        tax_amount: Number(data.tax_amount) || f.tax_amount,
        description: data.description || f.description,
      }));
      const matched = data.matched_customer_id ? " · Customer matched" : data.customer_business_name ? ` · Customer "${data.customer_business_name}" not found — please select` : "";
      toast.success(`Invoice auto-filled by AI${matched}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "OCR failed");
    } finally { setOcrLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="btn-add-invoice" className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white"><Plus className="w-4 h-4 mr-2" /> Add invoice</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>Add invoice details manually, or upload a PDF/image and let AI auto-fill the fields.</DialogDescription>
        </DialogHeader>
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#0A3B2C]/30 rounded-lg bg-[#0A3B2C]/5 text-[#0A3B2C] hover:bg-[#0A3B2C]/10 cursor-pointer transition-colors" data-testid="inv-form-ocr-upload">
          {ocrLoading ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Upload className="w-4 h-4" />}
          <span className="text-sm font-medium">{ocrLoading ? "Extracting with AI…" : "Upload invoice PDF/image — AI auto-fill"}</span>
          <input type="file" accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={onOcrUpload} disabled={ocrLoading} />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Customer</Label>
            <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
              <SelectTrigger data-testid="inv-form-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Invoice number</Label><Input data-testid="inv-form-number" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></div>
          <div><Label>Amount (₹)</Label><Input data-testid="inv-form-amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
          <div><Label>Tax (₹)</Label><Input type="number" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: +e.target.value })} /></div>
          <div><Label>Invoice date</Label><Input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Due date</Label><Input type="date" data-testid="inv-form-due-date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <Button data-testid="inv-form-save-btn" onClick={create} className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white">Create invoice</Button>
      </DialogContent>
    </Dialog>
  );
}

export default function Invoices() {
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState(false);

  const load = useCallback(() => api.get("/invoices", { params: { status: status === "All" ? undefined : status, search: search || undefined } }).then((r) => setList(r.data)), [status, search]);
  useEffect(() => { api.get("/customers").then((r) => setCustomers(r.data)); }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    await api.delete(`/invoices/${id}`); toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight" data-testid="invoices-title">Invoices</h1>
          <p className="text-gray-500 mt-1">{list.length} {status === "All" ? "total" : status.toLowerCase()}</p>
        </div>
        <CreateInvoiceDialog open={open} setOpen={setOpen} customers={customers} onCreated={load} />
      </div>

      <InvoiceFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} />

      {list.length === 0 && !search && status === "All" ? (
        <EmptyState
          icon={FileTextIcon}
          title="No invoices yet"
          description="Add your first invoice and PayGuard will auto-track due dates, overdue status, and generate AI follow-ups."
          actionLabel="Create your first invoice"
          onAction={() => setOpen(true)}
          testid="invoices-empty-state"
        />
      ) : (
        <InvoiceTable list={list} onDelete={del} />
      )}
    </div>
  );
}
