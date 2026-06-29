import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  MessageSquareText,
  Receipt,
  Settings,
  Sparkles,
  Users,
  UserPlus,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const audiences = [
  "Small businesses",
  "Wholesalers",
  "Distributors",
  "Service providers",
  "Agencies",
  "Consultants",
  "Accountants",
  "B2B vendors",
  "Local traders",
  "Manufacturers",
  "SaaS and service businesses",
];

const workflow = [
  { title: "Add Client", icon: Users },
  { title: "Add Invoice", icon: FileText },
  { title: "Track Due Date", icon: ClipboardList },
  { title: "Follow Up", icon: MessageSquareText },
  { title: "Update Payment Status", icon: CheckCircle2 },
  { title: "Improve Cash Flow", icon: CircleDollarSign },
];

const quickNav = [
  { title: "Create account", text: "Start with a business login.", route: "/register", icon: UserPlus },
  { title: "Open dashboard", text: "See receivables at a glance.", route: "/app/dashboard", icon: LayoutDashboard },
  { title: "Add customers", text: "Create client records first.", route: "/app/customers", icon: Users },
  { title: "Add invoices", text: "Track due dates and status.", route: "/app/invoices", icon: Receipt },
  { title: "Generate follow-up", text: "Prepare recovery messages.", route: "/app/followups", icon: Sparkles },
  { title: "Record payments", text: "Update recovered amounts.", route: "/app/payments", icon: Wallet },
  { title: "Review insights", text: "Use reports and cashflow.", route: "/app/reports", icon: ClipboardList },
  { title: "Tune settings", text: "Set terms and reminders.", route: "/app/settings", icon: Settings },
];

const steps = [
  "Register or log in with your business account.",
  "Add customer details such as business name, phone, GST number, payment terms, and credit limit.",
  "Create invoices manually or upload a PDF/image invoice for AI-assisted field extraction.",
  "Track pending, due soon, overdue, partially paid, and paid invoices from the dashboard.",
  "Generate follow-up messages and record customer responses or promised payment dates.",
  "Record payments or mark invoices as paid when money is recovered.",
  "Review dashboards, reports, risk scores, and cashflow forecasts for better decisions.",
];

const benefits = [
  "Saves time spent checking unpaid invoices manually.",
  "Reduces missed follow-ups and improves payment discipline.",
  "Gives owners clear visibility into pending and overdue receivables.",
  "Helps identify risky customers before credit exposure grows.",
  "Improves cashflow planning with recovery and forecast insights.",
  "Keeps client, invoice, payment, and follow-up records organized.",
];

const faqs = [
  ["Does this recover payments automatically?", "It helps you track invoices, generate follow-up content, and record recovery actions. Actual collection still depends on business communication and customer payment."],
  ["Can I manage multiple clients?", "Yes. The Customers section stores client details and connects them to invoices, payments, follow-ups, and risk insights."],
  ["Can it send WhatsApp or email reminders automatically?", "The app supports AI-generated follow-up messages and reminder channels in settings. Fully automated external sending is a recommended future enhancement."],
  ["Can I upload an invoice?", "Yes. The invoice screen supports PDF/image upload for AI-assisted extraction of invoice details."],
  ["Is this useful for small businesses?", "Yes. It is designed for owners and teams that need a simple way to track pending bills without complex enterprise software."],
  ["Can accountants use it?", "Yes. Accountants can use it to monitor receivables, overdue invoices, payment records, and recovery status for business clients."],
];

const Section = ({ title, children, icon: Icon }) => (
  <section className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
    <div className="flex items-center gap-3 mb-4">
      {Icon && <div className="w-10 h-10 rounded-lg bg-[#0A3B2C]/10 text-[#0A3B2C] flex items-center justify-center"><Icon className="w-5 h-5" /></div>}
      <h2 className="font-display text-xl font-semibold text-gray-900">{title}</h2>
    </div>
    {children}
  </section>
);

export default function HowToUse() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-[#0A3B2C] text-white rounded-xl p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Business guide</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2">How to Use Invoice Recovery Platform</h1>
        <p className="text-emerald-50 mt-3 max-w-3xl">
          Track unpaid invoices, manage payment follow-ups, record recoveries, and understand cashflow risk from one organized workspace.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0A3B2C] hover:bg-emerald-50">
            <UserPlus className="w-4 h-4" /> Create account
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            <LogIn className="w-4 h-4" /> Log in
          </Link>
        </div>
      </div>

      <Section title="Quick navigation path for new users" icon={ArrowRight}>
        <p className="text-gray-600 leading-7 mb-5">
          Follow this animated path the first time you use the product. It shows the fastest way to understand how invoice recovery works from setup to insights.
        </p>
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="absolute left-6 right-6 top-10 hidden lg:block h-1 rounded-full bg-gray-200">
            <div className="h-1 rounded-full bg-[#0A3B2C] animate-[quickNavProgress_7s_ease-in-out_infinite]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {quickNav.map((item, index) => (
              <Link
                key={item.title}
                to={item.route}
                className="group relative rounded-xl border border-gray-200 bg-white p-4 hover:border-[#0A3B2C]/40 hover:shadow-md transition-all"
                style={{ animation: "quickNavLift 4s ease-in-out infinite", animationDelay: `${index * 0.22}s` }}
              >
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#0A3B2C] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="mt-3 text-xs font-bold text-[#0A3B2C]">Step {index + 1}</p>
                  <h3 className="font-semibold text-gray-900 text-sm mt-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-5 mt-1">{item.text}</p>
                  <p className="text-[11px] text-gray-400 mt-2">{item.route}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes quickNavLift {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes quickNavProgress {
            0% { width: 0%; }
            80% { width: 100%; }
            100% { width: 100%; }
          }
        `}</style>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="1. What is this product?" icon={FileText}>
          <p className="text-gray-600 leading-7">
            PayGuard AI is an invoice recovery and payment follow-up platform for businesses that sell on credit.
            It keeps customers, invoices, payments, follow-ups, and recovery status in one place so owners can see what is pending and what needs attention.
          </p>
        </Section>

        <Section title="2. What problem does it solve?" icon={AlertTriangle}>
          <p className="text-gray-600 leading-7">
            Many businesses lose time and cashflow because payment reminders are handled through memory, calls, spreadsheets, and scattered messages.
            This platform reduces missed reminders, poor tracking, delayed collection, and lack of visibility into overdue invoices.
          </p>
        </Section>
      </div>

      <Section title="3. Who should use it?" icon={Users}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {audiences.map((item) => (
            <div key={item} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">{item}</div>
          ))}
        </div>
      </Section>

      <Section title="4. How does it work?" icon={ClipboardList}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
          {workflow.map((item, index) => (
            <div key={item.title} className="relative rounded-xl border border-gray-200 bg-gray-50 p-4 min-h-28">
              <item.icon className="w-5 h-5 text-[#0A3B2C]" />
              <p className="font-semibold text-gray-900 mt-3">{item.title}</p>
              {index < workflow.length - 1 && <ArrowRight className="hidden xl:block absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />}
            </div>
          ))}
        </div>
      </Section>

      <Section title="5. Step-by-step user guide" icon={CheckCircle2}>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step} className="flex gap-3">
              <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#0A3B2C] text-white flex items-center justify-center text-sm font-semibold">{index + 1}</div>
              <p className="text-gray-700 pt-1">{step}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="6. Business benefits" icon={CircleDollarSign}>
          <ul className="space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex gap-2 text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="7. Real-world example" icon={MessageSquareText}>
          <p className="text-gray-600 leading-7">
            A distributor supplying goods to 100 retail shops can use this platform to track who has paid,
            who is overdue, which customers need reminders, and how much money is likely to come in this month.
          </p>
        </Section>
      </div>

      <Section title="8. Frequently asked questions" icon={HelpCircle}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {faqs.map(([question, answer]) => (
            <div key={question} className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">{question}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-6">{answer}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
