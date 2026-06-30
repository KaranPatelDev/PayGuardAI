import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Surface } from "@/components/app/ProductUI";

export default function Settings() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/settings").then((r) => setS(r.data)); }, []);

  const save = async () => {
    await api.put("/settings", {
      default_payment_terms: s.default_payment_terms,
      default_followup_tone: s.default_followup_tone,
      default_reminder_days: s.default_reminder_days,
      reminder_channels: s.reminder_channels,
      ai_provider: s.ai_provider,
    });
    toast.success("Settings saved");
  };

  if (!s) return <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        eyebrow="Defaults"
        title="Settings"
        description="Set the reminder defaults PayGuard uses when creating invoices and follow-up drafts."
      />
      <Surface className="p-6 space-y-4">
        <div><Label>Default payment terms (days)</Label><Input type="number" value={s.default_payment_terms} onChange={(e) => setS({ ...s, default_payment_terms: +e.target.value })} className="mt-1.5" /></div>
        <div><Label>Default follow-up tone</Label>
          <Select value={s.default_followup_tone} onValueChange={(v) => setS({ ...s, default_followup_tone: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{["Polite","Professional","Friendly","Strict","Final warning"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>AI provider</Label>
          <Select value={s.ai_provider} onValueChange={(v) => setS({ ...s, ai_provider: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{["claude-sonnet-4-6","gpt-5.4","gemini-3-flash-preview"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Currency</Label><Input value="INR (₹)" disabled className="mt-1.5" /></div>
        <Button onClick={save} className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white" data-testid="settings-save-btn">Save reminder defaults</Button>
      </Surface>
    </div>
  );
}
