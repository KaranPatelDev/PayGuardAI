import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { Wallet } from "lucide-react";
import EmptyState from "@/components/app/EmptyState";

export default function Payments() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/payments").then((r) => setList(r.data)); }, []);

  const total = list.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight" data-testid="payments-title">Payments</h1>
        <p className="text-gray-500 mt-1">{list.length} payments · {formatINR(total)} received</p>
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments yet"
          description="Once you record payments against invoices, they'll appear here as your recovery proof trail."
          testid="payments-empty-state"
        />
      ) : (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-5 py-3 font-medium">Date</th><th className="text-left px-5 py-3 font-medium">Customer</th><th className="text-left px-5 py-3 font-medium">Invoice</th><th className="text-left px-5 py-3 font-medium">Amount</th><th className="text-left px-5 py-3 font-medium">Mode</th><th className="text-left px-5 py-3 font-medium">Reference</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
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
      )}
    </div>
  );
}
