import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Sparkles, Copy, Send, MessageSquare, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TONES = ["Polite", "Professional", "Friendly", "Strict", "Final warning"];
const TYPES = ["Gentle reminder before due date","Due date reminder","First overdue reminder","Strong overdue reminder","Final escalation warning","Relationship-friendly reminder","WhatsApp short message","Formal email message","Call script"];

export default function FollowupGenerator() {
  const location = useLocation();
  const presetId = location.state?.invoiceId;
  const [invoices, setInvoices] = useState([]);
  const [invoiceId, setInvoiceId] = useState(presetId || "");
  const [tone, setTone] = useState("Professional");
  const [type, setType] = useState("First overdue reminder");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => { api.get("/invoices", { params: { status: undefined } }).then((r) => setInvoices(r.data.filter(i => i.pending_amount > 0))); }, []);
  useEffect(() => { if (invoiceId) api.get(`/invoices/${invoiceId}`).then(r => setInvoice(r.data)); }, [invoiceId]);

  const generate = async () => {
    if (!invoiceId) return toast.error("Select an invoice");
    setLoading(true); setOut(null);
    try {
      const { data } = await api.post("/ai/generate-followup", { invoice_id: invoiceId, tone, message_type: type });
      setOut(data);
    } catch (e) { toast.error("Generation failed"); }
    finally { setLoading(false); }
  };

  const save = async (channel) => {
    if (!out) return;
    const msg = channel === "WhatsApp" ? out.whatsapp : channel === "Email" ? out.email_body : out.call_script;
    await api.post("/followups", {
      invoice_id: invoiceId, followup_type: type, message: msg,
      email_subject: out.email_subject, email_body: out.email_body, call_script: out.call_script,
      channel, tone, status: "Sent",
    });
    toast.success(`Saved ${channel} follow-up to proof trail`);
  };

  const copy = (text, label) => { navigator.clipboard.writeText(text); toast.success(`${label} copied`); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight" data-testid="followup-title">AI Follow-up Generator</h1>
        <p className="text-gray-500 mt-1">Generate WhatsApp, email, and call scripts in seconds.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 grid md:grid-cols-3 gap-4">
        <div>
          <Label>Invoice</Label>
          <Select value={invoiceId} onValueChange={setInvoiceId}>
            <SelectTrigger data-testid="followup-invoice-select"><SelectValue placeholder="Select invoice" /></SelectTrigger>
            <SelectContent>{invoices.map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number} — {i.customer_name} ({formatINR(i.pending_amount)})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger data-testid="followup-tone-select"><SelectValue /></SelectTrigger>
            <SelectContent>{TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Message type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-testid="followup-type-select"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Button onClick={generate} disabled={loading} className="bg-[#0A3B2C] hover:bg-[#072A1F] text-white w-full sm:w-auto" data-testid="followup-generate-btn">
            <Sparkles className="w-4 h-4 mr-2" /> {loading ? "Generating with Claude…" : "Generate AI follow-up"}
          </Button>
        </div>
      </div>

      {invoice && (
        <div className="bg-gradient-to-br from-[#0A3B2C]/5 to-transparent border border-gray-200 rounded-xl p-5">
          <p className="text-sm"><span className="font-medium">{invoice.customer?.business_name}</span> · {invoice.invoice_number} · {formatINR(invoice.total_amount)} · Due {formatDate(invoice.due_date)} {invoice.overdue_days > 0 && <span className="text-orange-700">({invoice.overdue_days}d overdue)</span>}</p>
        </div>
      )}

      {out && (
        <div className="grid md:grid-cols-3 gap-4 animate-fade-up" data-testid="followup-output">
          <OutCard icon={MessageSquare} title="WhatsApp" body={out.whatsapp} onCopy={() => copy(out.whatsapp, "WhatsApp")} onSave={() => save("WhatsApp")} waPhone={invoice?.customer?.phone} waMessage={out.whatsapp} />
          <OutCard icon={Mail} title="Email" subject={out.email_subject} body={out.email_body} onCopy={() => copy(`${out.email_subject}\n\n${out.email_body}`, "Email")} onSave={() => save("Email")} mailTo={invoice?.customer?.email} mailSubject={out.email_subject} mailBody={out.email_body} />
          <OutCard icon={Phone} title="Call script" body={out.call_script} onCopy={() => copy(out.call_script, "Call script")} onSave={() => save("Phone Call")} callPhone={invoice?.customer?.phone} />
        </div>
      )}
    </div>
  );
}

const OutCard = ({ icon: Icon, title, subject, body, onCopy, onSave, waPhone, waMessage, mailTo, mailSubject, mailBody, callPhone }) => {
  const cleanPhone = (p) => (p || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  const waHref = waPhone ? `https://wa.me/${cleanPhone(waPhone)}?text=${encodeURIComponent(waMessage || "")}` : null;
  const mailHref = mailTo ? `mailto:${mailTo}?subject=${encodeURIComponent(mailSubject || "")}&body=${encodeURIComponent(mailBody || "")}` : null;
  const telDigits = cleanPhone(callPhone);
  const telHref = callPhone ? `tel:${telDigits.length >= 11 ? "+" : ""}${telDigits}` : null;
  const sendHref = waHref || mailHref || telHref;
  const sendLabel = waHref ? "Open in WhatsApp" : mailHref ? "Open in Email" : telHref ? "Call now" : null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-[#0A3B2C]/10 text-[#0A3B2C] flex items-center justify-center"><Icon className="w-4 h-4" /></div><h4 className="font-display text-lg font-medium">{title}</h4></div>
      {subject && <div className="mb-2"><p className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">Subject</p><p className="text-sm font-medium mt-1">{subject}</p></div>}
      <Textarea rows={8} value={body} readOnly className="text-sm bg-gray-50 resize-none flex-1" data-testid={`out-${title.toLowerCase().replace(/\s+/g,'-')}-body`} />
      <div className="flex gap-2 mt-3 flex-wrap">
        <Button size="sm" variant="outline" onClick={onCopy} className="flex-1" data-testid={`copy-${title.toLowerCase().replace(/\s+/g,'-')}-btn`}><Copy className="w-3.5 h-3.5 mr-1.5" /> Copy</Button>
        <Button size="sm" onClick={onSave} className="flex-1 bg-[#0A3B2C] hover:bg-[#072A1F] text-white" data-testid={`save-${title.toLowerCase().replace(/\s+/g,'-')}-btn`}><Send className="w-3.5 h-3.5 mr-1.5" /> Save sent</Button>
      </div>
      {sendHref && (
        <a href={sendHref} target="_blank" rel="noopener noreferrer" data-testid={`open-${title.toLowerCase().replace(/\s+/g,'-')}-link`}
           className="mt-2 inline-flex items-center justify-center w-full px-3 py-2 rounded-lg text-sm font-medium border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
          {sendLabel}
        </a>
      )}
    </div>
  );
};
