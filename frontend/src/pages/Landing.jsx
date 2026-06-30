import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

const Section = ({ children, className = "" }) => (
  <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
);

const Logo = ({ light = false }) => (
  <Link to="/" className="flex items-center gap-2.5" data-testid="landing-logo">
    <div className={`${light ? "bg-white/12" : "bg-[#0A3B2C]"} w-8 h-8 rounded-lg flex items-center justify-center`}>
      <ShieldCheck className="w-5 h-5 text-white" />
    </div>
    <span className={`font-display text-lg font-semibold tracking-normal ${light ? "text-white" : "text-gray-950"}`}>PayGuard AI</span>
  </Link>
);

const invoices = [
  { id: "INV-2041", customer: "Aarav Textiles", due: "8d overdue", amount: 184000, risk: "High", tone: "Firm reminder" },
  { id: "INV-2038", customer: "Nexa Packaging", due: "Due today", amount: 72500, risk: "Medium", tone: "Professional" },
  { id: "INV-2034", customer: "Veda Foods", due: "Paid", amount: 96000, risk: "Low", tone: "Logged" },
];

const workflow = [
  { icon: Users, title: "Build the customer ledger", text: "Store contacts, GST details, terms, credit limits, notes, and payment behavior in one place." },
  { icon: FileText, title: "Track every invoice", text: "Know what is pending, what is overdue, and how much cash is still blocked by each account." },
  { icon: Bell, title: "Send the right reminder", text: "Generate WhatsApp, email, and call scripts matched to due dates, tone, and customer risk." },
  { icon: CheckCircle2, title: "Record recovery proof", text: "Save follow-ups and payments so your team has a reliable trail before the next escalation." },
];

const channels = [
  { icon: MessageSquare, label: "WhatsApp", text: "Short, direct payment reminders ready to send." },
  { icon: Mail, label: "Email", text: "Subject and body for formal follow-ups." },
  { icon: Phone, label: "Call script", text: "Structured talking points for collection calls." },
];

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="bg-[#F7F8F5] text-gray-950">
      <header className="sticky top-0 z-40 bg-white/82 backdrop-blur-xl border-b border-[#E2E5DD]">
        <Section className="h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/how-to-use" data-testid="landing-how-to-use-link"><Button variant="ghost" className="rounded-lg">How to Use</Button></Link>
            <Link to="/pricing" data-testid="landing-pricing-link"><Button variant="ghost" className="rounded-lg">Pricing</Button></Link>
            <Link to="/login" data-testid="landing-login-link"><Button variant="ghost" className="rounded-lg">Log in</Button></Link>
            <Link to="/register" data-testid="landing-signup-link"><Button className="rounded-lg bg-[#0A3B2C] hover:bg-[#072A1F] text-white">Start tracking</Button></Link>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="sm:hidden p-2 -mr-2 rounded-lg hover:bg-[#F3F5EF]" aria-label="Menu">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </Section>
        {mobileMenu && (
          <div className="sm:hidden border-t border-[#E2E5DD] bg-white px-4 py-3 space-y-1">
            <Link to="/how-to-use" onClick={() => setMobileMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#F3F5EF]">How to Use</Link>
            <Link to="/pricing" onClick={() => setMobileMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#F3F5EF]">Pricing</Link>
            <Link to="/login" onClick={() => setMobileMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#F3F5EF]">Log in</Link>
            <Link to="/register" onClick={() => setMobileMenu(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-[#0A3B2C]">Start tracking</Link>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#0A3B2C] text-white">
          <Section className="min-h-[calc(100vh-4rem)] py-16 lg:py-20 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <p className="text-xs uppercase tracking-[0.18em] font-bold text-emerald-100">Invoice recovery workspace</p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.04] mt-5">
                Recover unpaid invoices without chasing blindly.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-white/78 leading-relaxed max-w-xl">
                PayGuard AI helps businesses track pending invoices, prioritize risky customers, create better payment reminders, and keep a proof trail for every recovery action.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/register" data-testid="landing-primary-cta">
                  <Button className="h-11 rounded-lg bg-white text-[#0A3B2C] hover:bg-emerald-50">
                    Start recovery workflow <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/login" data-testid="landing-demo-cta">
                  <Button variant="outline" className="h-11 rounded-lg border-white/30 bg-white/8 text-white hover:bg-white/12 hover:text-white">
                    View demo account
                  </Button>
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg">
                <Proof label="Overdue tracked" value={formatINR(426000)} />
                <Proof label="Open invoices" value="18" />
                <Proof label="Risk accounts" value="5" />
              </div>
            </div>

            <div className="lg:col-span-6">
              <ProductPreview />
            </div>
          </Section>
        </section>

        <Section className="py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-[#0A3B2C]">Built around the work</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-3">From unpaid invoice to recorded payment, every step has context.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            {workflow.map((item) => (
              <div key={item.title} className="pg-surface rounded-lg p-5">
                <div className="w-9 h-9 rounded-lg bg-[#0A3B2C]/10 text-[#0A3B2C] flex items-center justify-center">
                  <item.icon className="w-4 h-4" />
                </div>
                <h3 className="font-display text-lg font-semibold mt-4">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        <section className="bg-white border-y border-[#E2E5DD]">
          <Section className="py-16 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-bold text-[#0A3B2C]">Follow-ups that fit the situation</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-3">One invoice, three usable scripts.</h2>
              <p className="text-gray-600 mt-4 leading-relaxed">
                Select the invoice, choose a tone, and generate messages your team can actually send. The output uses customer name, invoice value, due date, overdue days, and payment context.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-7">
                {channels.map((item) => (
                  <div key={item.label} className="rounded-lg border border-gray-200 p-4 bg-[#FAFBF7]">
                    <item.icon className="w-5 h-5 text-[#0A3B2C]" />
                    <p className="font-semibold mt-3">{item.label}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#DDE4D7] bg-[#F7F8F5] p-5 shadow-sm">
              <div className="rounded-lg bg-white border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-[0.16em] font-bold text-gray-500">Generated reminder</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  Hi Aarav Textiles team, this is a reminder that invoice INV-2041 for Rs. 1,84,000 is now 8 days overdue. Please confirm the expected payment date today so we can update our records.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-xs font-semibold">Firm</span>
                  <span className="rounded-md bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 text-xs font-semibold">8d overdue</span>
                  <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-semibold">Ready for WhatsApp</span>
                </div>
              </div>
            </div>
          </Section>
        </section>

        <Section className="py-16">
          <div className="rounded-lg bg-[#0A3B2C] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] font-bold text-white/60">Start with your next unpaid invoice</p>
              <h2 className="font-display text-3xl font-semibold mt-3">Turn payment recovery into a repeatable workflow.</h2>
            </div>
            <Link to="/register">
              <Button className="rounded-lg bg-white text-[#0A3B2C] hover:bg-emerald-50">Create account <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </Section>
      </main>

      <footer className="border-t border-[#E2E5DD] bg-white">
        <Section className="h-16 flex items-center justify-between text-sm text-gray-500">
          <Logo />
          <p>© 2026 PayGuard AI</p>
        </Section>
      </footer>
    </div>
  );
}

const Proof = ({ label, value }) => (
  <div>
    <p className="font-display text-xl font-semibold">{value}</p>
    <p className="text-xs text-white/62 mt-1">{label}</p>
  </div>
);

const ProductPreview = () => (
  <div className="rounded-lg border border-white/14 bg-white/10 p-3 shadow-2xl backdrop-blur">
    <div className="rounded-lg bg-white text-gray-950 overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] font-bold text-gray-500">Recovery queue</p>
          <p className="font-display text-xl font-semibold mt-1">Invoices needing action</p>
        </div>
        <span className="rounded-md bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 text-xs font-semibold">₹4.26L overdue</span>
      </div>
      <div className="divide-y divide-gray-100">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="px-5 py-4 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5">
              <p className="font-semibold text-sm">{invoice.customer}</p>
              <p className="text-xs text-gray-500 mt-0.5">{invoice.id}</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm font-semibold">{formatINR(invoice.amount)}</p>
              <p className={`text-xs mt-0.5 ${invoice.due === "Paid" ? "text-emerald-700" : "text-orange-700"}`}>{invoice.due}</p>
            </div>
            <div className="col-span-2">
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${invoice.risk === "High" ? "bg-orange-50 text-orange-700" : invoice.risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{invoice.risk}</span>
            </div>
            <div className="col-span-2 text-right">
              <p className="text-xs font-semibold text-[#0A3B2C]">{invoice.tone}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#F7F8F5] border-t border-gray-200 p-5 grid sm:grid-cols-3 gap-3">
        <MiniStat label="This week" value="₹1.18L" />
        <MiniStat label="Likely delayed" value="₹86K" />
        <MiniStat label="Recovered" value="₹2.9L" />
      </div>
    </div>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-lg bg-white border border-gray-200 p-3">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-display text-lg font-semibold mt-1">{value}</p>
  </div>
);
