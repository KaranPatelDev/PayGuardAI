import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil, X, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge } from "@/components/app/Badges";
import EmptyState from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/ProductUI";

const empty = { business_name: "", contact_person: "", email: "", phone: "", city: "", state: "", gst_number: "", payment_terms: 30, credit_limit: 0, notes: "" };

function CustomerFilters({ search, setSearch, riskFilter, setRiskFilter }) {
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input data-testid="cust-search" placeholder="Search by business name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
      </div>
      <Select value={riskFilter} onValueChange={setRiskFilter}>
        <SelectTrigger data-testid="cust-risk-filter" className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          {["All", "Low Risk", "Medium Risk", "High Risk", "Critical Risk"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function CustomerTable({ list, onEdit, onDelete }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block pg-surface rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F3F5EF] text-gray-600">
              <tr><th className="text-left px-5 py-3 font-medium">Customer account</th><th className="text-left px-5 py-3 font-medium">Primary contact</th><th className="text-left px-5 py-3 font-medium">Pending balance</th><th className="text-left px-5 py-3 font-medium">Open invoices</th><th className="text-left px-5 py-3 font-medium">Payment risk</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No customers match your filters.</td></tr>
              ) : list.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 pg-table-row" data-testid={`customer-row-${c.id}`}>
                  <td className="px-5 py-3"><Link to={`/app/customers/${c.id}`} className="font-medium text-gray-900 hover:text-[#0A3B2C]">{c.business_name}</Link><p className="text-xs text-gray-500">{c.city}{c.state ? `, ${c.state}` : ""}</p></td>
                  <td className="px-5 py-3">{c.contact_person || "—"}<p className="text-xs text-gray-500">{c.phone}</p></td>
                  <td className="px-5 py-3 font-medium">{formatINR(c.total_pending || 0)}</td>
                  <td className="px-5 py-3">{c.invoice_count || 0}</td>
                  <td className="px-5 py-3"><RiskBadge risk={c.risk_category} /></td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => onEdit(c)} className="p-2 hover:bg-gray-100 rounded-lg" data-testid={`edit-customer-${c.id}`}><Pencil className="w-4 h-4 text-gray-600" /></button>
                    <button onClick={() => onDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg" data-testid={`delete-customer-${c.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {list.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No customers match your filters.</div>
        ) : list.map((c) => (
          <div key={c.id} className="pg-surface rounded-lg p-4 space-y-3" data-testid={`customer-card-${c.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/app/customers/${c.id}`} className="font-medium text-gray-900 hover:text-[#0A3B2C] block truncate">{c.business_name}</Link>
                <p className="text-xs text-gray-500 mt-0.5">{c.contact_person}{c.phone ? ` · ${c.phone}` : ""}</p>
                {(c.city || c.state) && <p className="text-xs text-gray-400 mt-0.5">{c.city}{c.state ? `, ${c.state}` : ""}</p>}
              </div>
              <RiskBadge risk={c.risk_category} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-sm font-medium">{formatINR(c.total_pending || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Invoices</p>
                <p className="text-sm font-medium">{c.invoice_count || 0}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(c)} className="p-2 hover:bg-gray-100 rounded-lg" data-testid={`edit-customer-${c.id}`}><Pencil className="w-4 h-4 text-gray-600" /></button>
                <button onClick={() => onDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg" data-testid={`delete-customer-${c.id}`}><Trash2 className="w-4 h-4 text-red-600" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CustomerDialog({ open, setOpen, editing, onSave }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editing) setForm({ ...empty, ...editing });
    else setForm(empty);
  }, [editing, open]);

  const save = async () => {
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form);
      else await api.post("/customers", form);
      toast.success(editing ? "Customer updated" : "Customer created");
      setOpen(false); onSave();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit customer account" : "Add customer account"}</DialogTitle>
          <DialogDescription>{editing ? "Update contact, credit, and payment terms for recovery decisions." : "Create the customer ledger PayGuard will use for invoices, reminders, and risk history."}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label>Business name</Label><Input data-testid="cust-form-business-name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
          <div><Label>Contact person</Label><Input data-testid="cust-form-contact" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
          <div><Label>Phone</Label><Input data-testid="cust-form-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Email</Label><Input data-testid="cust-form-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><Label>GST</Label><Input value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value })} /></div>
          <div><Label>Payment terms (days)</Label><Input type="number" value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: +e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Credit limit (₹)</Label><Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: +e.target.value })} /></div>
        </div>
        <Button data-testid="cust-form-save-btn" onClick={save} className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white">Save customer account</Button>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => api.get("/customers", { params: { search: search || undefined, risk: riskFilter } }).then((r) => setList(r.data)), [search, riskFilter]);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setOpen(true); };

  const del = async (id) => {
    if (!window.confirm("Delete this customer and all their invoices?")) return;
    await api.delete(`/customers/${id}`); toast.success("Deleted"); load();
  };

  const showEmpty = list.length === 0 && !search && riskFilter === "All";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer ledger"
        title="Customers"
        description={`${list.length} customer accounts with payment terms, outstanding balances, and risk history.`}
        action={(
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="btn-add-customer" onClick={openCreate} className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white rounded-lg">
              <Plus className="w-4 h-4 mr-2" /> Add customer
            </Button>
          </DialogTrigger>
        </Dialog>
        )}
      />

      <CustomerFilters search={search} setSearch={setSearch} riskFilter={riskFilter} setRiskFilter={setRiskFilter} />

      {showEmpty ? (
        <EmptyState
          icon={UsersIcon}
          title="No customer ledger yet"
          description="Add a customer before creating invoices so PayGuard can connect reminders, payments, and risk history to the right account."
          actionLabel="Add your first customer"
          onAction={openCreate}
          testid="customers-empty-state"
        />
      ) : (
        <CustomerTable list={list} onEdit={openEdit} onDelete={del} />
      )}

      <CustomerDialog open={open} setOpen={setOpen} editing={editing} onSave={load} />
    </div>
  );
}
