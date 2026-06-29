import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, TrendingUp, FileText, Users, Bell, ArrowRight, CheckCircle2, MessageSquare, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

const Section = ({ children, className = "" }) => (
  <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
);

export default function Landing() {
  return (
    <div className="bg-[#F9FAFB] text-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-200">
        <Section className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0A3B2C] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">PayGuard AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/how-to-use" data-testid="landing-how-to-use-link"><Button variant="ghost" className="rounded-lg">How to Use</Button></Link>
            <Link to="/login" data-testid="landing-login-link"><Button variant="ghost" className="rounded-lg">Log in</Button></Link>
            <Link to="/register" data-testid="landing-signup-link"><Button className="rounded-lg bg-[#0A3B2C] hover:bg-[#072A1F] text-white">Get started</Button></Link>
          </div>
        </Section>
      </header>

      {/* Hero */}
      <Section className="pt-16 sm:pt-24 pb-16 relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#E8E6E1] text-[#0A3B2C] border border-[#cfcdc6]">
              <Sparkles className="w-3.5 h-3.5" /> Built for Indian MSMEs, freelancers & agencies
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mt-5 leading-[1.05]">
              Recover payments <br />
              <span className="text-[#0A3B2C]">faster</span> with AI.
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
              PayGuard AI helps Indian businesses track unpaid invoices, identify risky customers, generate smart WhatsApp & email follow-ups, and protect cashflow — all from one calm, modern dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" data-testid="hero-cta-register"><Button className="rounded-lg h-12 px-6 bg-[#0A3B2C] hover:bg-[#072A1F] text-white text-base">Start free <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
              <Link to="/login" data-testid="hero-cta-demo"><Button variant="outline" className="rounded-lg h-12 px-6 border-gray-300 text-base">Try the demo account</Button></Link>
            </div>
            <div className="mt-6 text-sm text-gray-500 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Demo: demo@payguard.ai / demo123</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">Live Recovery</div>
              <p className="font-display text-3xl font-semibold mt-2">{formatINR(437500)}</p>
              <p className="text-sm text-emerald-600 mt-1">+ {formatINR(125000)} recovered this week</p>

              <div className="mt-6 space-y-3">
                {[
                  { c: "ABC Traders", a: 125000, s: "Overdue 22d", color: "text-orange-700 bg-orange-50 border-orange-200" },
                  { c: "Raj Steel Corp.", a: 240000, s: "Critical Risk", color: "text-red-700 bg-red-50 border-red-200" },
                  { c: "Shree Ganesh Mfg.", a: 74500, s: "Due in 3d", color: "text-amber-700 bg-amber-50 border-amber-200" },
                ].map((r) => (
                  <div key={r.c} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition">
                    <div>
                      <p className="text-sm font-medium">{r.c}</p>
                      <p className="text-xs text-gray-500">{formatINR(r.a)}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border ${r.color}`}>{r.s}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-[#0A3B2C] text-white rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-white/70"><Sparkles className="w-3.5 h-3.5" /> AI WhatsApp</div>
                <p className="text-sm leading-relaxed mt-2">&quot;Namaste Rajesh ji, invoice INV-1001 of ₹1,25,000 was due on 5 Feb. Kindly confirm the expected payment date.&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Problem */}
      <Section className="py-16 border-t border-gray-200">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#0A3B2C]">The Problem</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mt-3 tracking-tight">Indian businesses don&apos;t fail from lack of sales — they fail from delayed payments.</h2>
          </div>
          <div className="space-y-4 text-gray-600">
            <p>Owners deliver products, raise invoices, and then wait weeks or months. Follow-ups happen across WhatsApp, calls, Excel sheets, and memory. Cashflow suffers. Salaries get delayed. Vendor pressure builds.</p>
            <p className="text-gray-900 font-medium">PayGuard AI turns payment recovery into a calm, AI-native workflow.</p>
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section className="py-16 border-t border-gray-200">
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#0A3B2C]">How it works</p>
        <h2 className="font-display text-3xl sm:text-4xl font-medium mt-3 tracking-tight max-w-3xl">From manual chaos to AI-powered recovery in 4 steps.</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {[
            { i: FileText, t: "Track invoices", d: "Upload or add invoices. Auto-detect overdue, due-soon, and partially paid statuses." },
            { i: Users, t: "Score customer risk", d: "AI analyses payment delays, broken promises, and behaviour to flag risky customers." },
            { i: Sparkles, t: "AI follow-ups", d: "Generate WhatsApp messages, emails, and call scripts in seconds — in your tone." },
            { i: TrendingUp, t: "Recover & forecast", d: "Visual recovery timeline, proof trail, and weekly cashflow forecast." },
          ].map((f) => (
            <div key={f.t} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-[#0A3B2C]/10 text-[#0A3B2C] flex items-center justify-center"><f.i className="w-5 h-5" /></div>
              <h3 className="font-display text-lg font-medium mt-4">{f.t}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* AI message preview */}
      <Section className="py-16 border-t border-gray-200">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#0A3B2C]">AI follow-ups</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mt-3 tracking-tight">Three messages. One click. Indian business tone built-in.</h2>
            <p className="mt-4 text-gray-600">Pick a tone — polite, professional, friendly, strict, or final warning. PayGuard generates the WhatsApp, email, and call script together. Copy, send, and save proof.</p>
            <ul className="mt-6 space-y-2 text-sm text-gray-700">
              {["WhatsApp message (1-3 lines)","Email subject + body","Call script with respectful framing","Auto-saved as proof trail"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            {[
              { i: MessageSquare, label: "WhatsApp", body: "Namaste Rajesh ji, gentle reminder — invoice INV-1001 of ₹1,25,000 was due on 5 Feb. Kindly confirm the payment timeline." },
              { i: Mail, label: "Email subject", body: "Payment Reminder: Invoice INV-1001 of ₹1,25,000" },
              { i: Phone, label: "Call script", body: "Namaste Rajesh ji, I wanted to check the payment status for invoice INV-1001. The amount is ₹1,25,000 and it was due on 5 Feb. Can you please confirm today or tomorrow?" },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-gray-500"><m.i className="w-3.5 h-3.5" /> {m.label}</div>
                <p className="text-sm mt-2 leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Benefits */}
      <Section className="py-16 border-t border-gray-200">
        <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#0A3B2C]">Why it matters</p>
        <h2 className="font-display text-3xl sm:text-4xl font-medium mt-3 tracking-tight max-w-3xl">Delayed payments hurt salaries, growth, and survival. PayGuard fixes that.</h2>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {[
            "Recover payments faster",
            "Reduce manual follow-up work",
            "Improve cashflow visibility",
            "Avoid risky customers",
            "Maintain proper proof trail",
            "Generate professional reminders",
            "Reduce awkward payment calls",
            "Make smarter credit decisions",
            "Build business discipline",
          ].map((b) => (
            <div key={b} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-5">
              <CheckCircle2 className="w-5 h-5 text-[#0A3B2C] mt-0.5" />
              <span className="text-sm font-medium">{b}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-20 border-t border-gray-200">
        <div className="bg-[#0A3B2C] rounded-2xl p-10 sm:p-14 relative overflow-hidden grain">
          <div className="relative z-10 max-w-2xl">
            <Bell className="w-6 h-6 text-white/80" />
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-white mt-4 tracking-tight">Stop chasing payments. Start recovering them.</h2>
            <p className="mt-4 text-white/80">Try the demo account or create your own in 30 seconds. No credit card required.</p>
            <div className="mt-7 flex gap-3 flex-wrap">
              <Link to="/register" data-testid="footer-cta-register"><Button className="rounded-lg h-12 px-6 bg-white text-[#0A3B2C] hover:bg-gray-100 text-base">Create my account</Button></Link>
              <Link to="/login" data-testid="footer-cta-login"><Button variant="outline" className="rounded-lg h-12 px-6 border-white/30 text-white bg-transparent hover:bg-white/10 text-base">Try demo</Button></Link>
            </div>
          </div>
        </div>
      </Section>

      <footer className="border-t border-gray-200 py-8">
        <Section className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">© 2026 PayGuard AI — Recover faster. Build calmer.</p>
          <p className="text-sm text-gray-500">Made for Indian MSMEs</p>
        </Section>
      </footer>
    </div>
  );
}
