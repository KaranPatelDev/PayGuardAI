import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { Wallet } from "lucide-react";
import EmptyState from "@/components/app/EmptyState";
import { PageHeader, MetricCard } from "@/components/app/ProductUI";

export default function Payments() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/payments").then((r) => setList(r.data)); }, []);

  const total = list.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Proof trail"
        title="Payments"
        description="A clean record of recovered cash, payment modes, invoice references, and collection history."
      />
      <div className="max-w-sm">
        <MetricCard icon={Wallet} label="Recovered payments" value={formatINR(total)} sub={`${list.length} payment records`} accent="bg-emerald-100 text-emerald-700" />
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments yet"
          description="Payments recorded against invoices will appear here with date, mode, reference, and customer context."
          testid="payments-empty-state"
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block pg-surface rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F3F5EF] text-gray-600"><tr><th className="text-left px-5 py-3 font-medium">Received on</th><th className="text-left px-5 py-3 font-medium">Customer</th><th className="text-left px-5 py-3 font-medium">Invoice</th><th className="text-left px-5 py-3 font-medium">Amount recovered</th><th className="text-left px-5 py-3 font-medium">Mode</th><th className="text-left px-5 py-3 font-medium">Reference</th></tr></thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100 pg-table-row">
                      <td className="px-5 py-3">{formatDate(p.payment_date)}</td>
                      <td className="px-5 py-3 font-medium">{p.customer_name}</td>
                      <td className="px-5 py-3 text-gray-600">{p.invoice_number}</td>
                      <td className="px-5 py-3 font-medium text-emerald-700">{formatINR(p.amount)}</td>
                      <td className="px-5 py-3">{p.payment_mode}</td>
                      <td className="px-5 py-3 text-gray-500">{p.reference_number || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {list.map((p) => (
              <div key={p.id} className="pg-surface rounded-lg p-4 space-y-2" data-testid={`payment-card-${p.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.customer_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.invoice_number} · {formatDate(p.payment_date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 shrink-0">{formatINR(p.amount)}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{p.payment_mode}</span>
                  <span>{p.reference_number || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
