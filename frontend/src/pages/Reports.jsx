import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader, Surface } from "@/components/app/ProductUI";

export default function Reports() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/customers").then((r) => setCustomers(r.data)); }, []);

  const generate = async () => {
    if (!customerId) return toast.error("Select a customer");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/generate-recovery-report", { customer_id: customerId });
      setReport(data);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer review"
        title="Recovery reports"
        description="Generate a concise account summary before an escalation call, settlement discussion, or management review."
      />

      <Surface className="p-6 grid md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger data-testid="report-customer-select"><SelectValue placeholder="Select customer" /></SelectTrigger>
            <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={generate} disabled={loading} className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white" data-testid="generate-report-btn">
          <Sparkles className="w-4 h-4 mr-2" /> {loading ? "Preparing report…" : "Generate recovery report"}
        </Button>
      </Surface>

      {report && (
        <Surface className="p-6 animate-fade-up">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-display text-xl font-medium">Recovery report</h3>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(report.report); toast.success("Copied"); }} data-testid="copy-report-btn"><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Report</Button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-5 rounded-lg border border-gray-100">{report.report}</pre>
        </Surface>
      )}
    </div>
  );
}
