import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ShieldCheck, Sparkles, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

const billingOptions = [
  { key: "monthly", label: "Monthly" },
  { key: "sixMonthly", label: "6 Months" },
  { key: "yearly", label: "Yearly" },
];

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Try PayGuard AI with no commitment",
    monthly: 0,
    sixMonthly: 0,
    yearly: 0,
    cta: "Get started free",
    ctaLink: "/register",
    popular: false,
    features: {
      customers: { value: "5", included: true },
      invoices: { value: "10 / month", included: true },
      aiFollowups: { value: "5 / month", included: true },
      ocr: { value: "2 / month", included: true },
      riskScoring: { value: "Basic", included: true },
      cashflowForecast: { value: null, included: false },
      recoveryReports: { value: null, included: false },
      teamMembers: { value: "1", included: true },
      dataRetention: { value: "30 days", included: true },
      support: { value: "Community", included: true },
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For growing businesses with regular credit sales",
    monthly: 799,
    sixMonthly: 3999,
    yearly: 6999,
    cta: "Start Starter plan",
    ctaLink: "/register",
    popular: true,
    features: {
      customers: { value: "50", included: true },
      invoices: { value: "Unlimited", included: true },
      aiFollowups: { value: "100 / month", included: true },
      ocr: { value: "50 / month", included: true },
      riskScoring: { value: "Advanced", included: true },
      cashflowForecast: { value: "Basic", included: true },
      recoveryReports: { value: "3 / month", included: true },
      teamMembers: { value: "3", included: true },
      dataRetention: { value: "1 year", included: true },
      support: { value: "Email (48h)", included: true },
    },
  },
  {
    id: "growth",
    name: "Growth",
    description: "For established businesses with large receivables",
    monthly: 2499,
    sixMonthly: 12999,
    yearly: 22999,
    cta: "Start Growth plan",
    ctaLink: "/register",
    popular: false,
    features: {
      customers: { value: "Unlimited", included: true },
      invoices: { value: "Unlimited", included: true },
      aiFollowups: { value: "Unlimited", included: true },
      ocr: { value: "Unlimited", included: true },
      riskScoring: { value: "Advanced", included: true },
      cashflowForecast: { value: "Advanced", included: true },
      recoveryReports: { value: "Unlimited", included: true },
      teamMembers: { value: "10", included: true },
      dataRetention: { value: "Unlimited", included: true },
      support: { value: "Priority (12h)", included: true },
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large operations needing custom solutions",
    monthly: null,
    sixMonthly: null,
    yearly: null,
    cta: "Contact us",
    ctaLink: "/register",
    popular: false,
    features: {
      customers: { value: "Unlimited", included: true },
      invoices: { value: "Unlimited", included: true },
      aiFollowups: { value: "Unlimited", included: true },
      ocr: { value: "Unlimited", included: true },
      riskScoring: { value: "Advanced + Custom Rules", included: true },
      cashflowForecast: { value: "Advanced + Custom", included: true },
      recoveryReports: { value: "Unlimited + White-label", included: true },
      teamMembers: { value: "Unlimited", included: true },
      dataRetention: { value: "Unlimited", included: true },
      support: { value: "Dedicated + WhatsApp", included: true },
    },
  },
];

const featureLabels = {
  customers: "Customers",
  invoices: "Invoices",
  aiFollowups: "AI Follow-ups",
  ocr: "Invoice OCR",
  riskScoring: "Risk Scoring",
  cashflowForecast: "Cashflow Forecast",
  recoveryReports: "Recovery Reports",
  teamMembers: "Team Members",
  dataRetention: "Data Retention",
  support: "Support",
};

const faqs = [
  [
    "Can I switch plans later?",
    "Yes. You can upgrade or downgrade at any time. When upgrading, you pay the difference for the remaining billing period. When downgrading, the change takes effect at the next billing cycle.",
  ],
  [
    "Is there a free trial for paid plans?",
    "The Free plan is available forever with no credit card required. You can upgrade to a paid plan whenever you need more features.",
  ],
  [
    "What payment methods do you accept?",
    "We accept UPI, net banking, debit cards, and all major credit cards. Enterprise customers can pay via invoice/NEFT.",
  ],
  [
    "What happens if I exceed my plan limits?",
    "You will be notified when approaching your limits. If you exceed them, you can either upgrade your plan or the system will gracefully limit new additions until the next billing cycle.",
  ],
  [
    "Do you offer refunds?",
    "We offer a full refund within 7 days of purchase if you are not satisfied. Contact support for assistance.",
  ],
];

function PriceDisplay({ plan, billing }) {
  const price = plan[billing];
  if (price === null) return <span className="text-2xl font-display font-semibold text-gray-900">Custom</span>;
  if (price === 0) return <span className="text-2xl font-display font-semibold text-gray-900">Free</span>;

  const monthlyEquiv =
    billing === "yearly" ? Math.round(price / 12) :
    billing === "sixMonthly" ? Math.round(price / 6) :
    price;

  return (
    <div>
      <span className="text-2xl font-display font-semibold text-gray-900">{formatINR(monthlyEquiv)}</span>
      <span className="text-sm text-gray-500"> / month</span>
      {billing !== "monthly" && (
        <p className="text-xs text-gray-500 mt-0.5">
          Billed {formatINR(price)} / {billing === "yearly" ? "year" : "6 months"}
        </p>
      )}
    </div>
  );
}

function SavingsBadge({ plan, billing }) {
  if (billing === "monthly" || plan[billing] === null || plan[billing] === 0) return null;
  const fullPrice = plan.monthly * (billing === "yearly" ? 12 : 6);
  const discountedPrice = plan[billing];
  const pct = Math.round(((fullPrice - discountedPrice) / fullPrice) * 100);
  if (pct <= 0) return null;
  return (
    <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
      Save {pct}%
    </span>
  );
}

function BillingToggle({ billing, setBilling }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {billingOptions.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setBilling(opt.key)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            billing === opt.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
          {opt.key === "yearly" && (
            <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">Save 27%</span>
          )}
        </button>
      ))}
    </div>
  );
}

function PlanCard({ plan, billing }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
        plan.popular
          ? "border-[#0A3B2C] shadow-lg ring-1 ring-[#0A3B2C]/10 scale-[1.02]"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      } bg-white`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#0A3B2C] text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Most Popular
          </span>
        </div>
      )}

      <SavingsBadge plan={plan} billing={billing} />

      <div>
        <h3 className="font-display text-xl font-semibold text-gray-900">{plan.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
      </div>

      <div className="mt-4">
        <PriceDisplay plan={plan} billing={billing} />
      </div>

      <Link to={plan.ctaLink} className="mt-6">
        <Button
          className={`w-full rounded-lg h-11 ${
            plan.popular
              ? "bg-[#0A3B2C] hover:bg-[#072A1F] text-white"
              : "bg-gray-900 hover:bg-gray-800 text-white"
          }`}
          data-testid={`pricing-cta-${plan.id}`}
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>

      <div className="mt-6 pt-6 border-t border-gray-100 space-y-2.5 flex-1">
        {Object.entries(plan.features).map(([key, feat]) => (
          <div key={key} className="flex items-start gap-2.5">
            {feat.included ? (
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
            )}
            <span className={`text-sm ${feat.included ? "text-gray-700" : "text-gray-400"}`}>
              {feat.value || featureLabels[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureComparisonTable({ billing }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 pr-4 font-medium text-gray-500">Feature</th>
            {plans.map((plan) => (
              <th key={plan.id} className="text-center py-3 px-4 font-medium text-gray-900">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(featureLabels).map(([key, label]) => (
            <tr key={key} className="border-b border-gray-100 last:border-0">
              <td className="py-3 pr-4 text-gray-700 font-medium">{label}</td>
              {plans.map((plan) => {
                const feat = plan.features[key];
                return (
                  <td key={plan.id} className="text-center py-3 px-4">
                    {feat.included ? (
                      feat.value ? (
                        <span className="text-gray-700">{feat.value}</span>
                      ) : (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      )
                    ) : (
                      <X className="w-4 h-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingFAQ() {
  return (
    <div className="space-y-4">
      {faqs.map(([question, answer]) => (
        <div key={question} className="rounded-xl bg-white border border-gray-200 p-5">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-[#0A3B2C] mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900">{question}</h3>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Pricing({ embedded = false }) {
  const [billing, setBilling] = useState("monthly");

  return (
    <div className={embedded ? "" : "bg-[#F9FAFB] min-h-screen"}>
      {!embedded && (
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5" data-testid="pricing-logo">
              <div className="w-8 h-8 rounded-lg bg-[#0A3B2C] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">PayGuard AI</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/how-to-use" data-testid="pricing-how-to-use-link"><Button variant="ghost" className="rounded-lg">How to Use</Button></Link>
              <Link to="/login" data-testid="pricing-login-link"><Button variant="ghost" className="rounded-lg">Log in</Button></Link>
              <Link to="/register" data-testid="pricing-signup-link"><Button className="rounded-lg bg-[#0A3B2C] hover:bg-[#072A1F] text-white">Get started</Button></Link>
            </div>
          </div>
        </header>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#0A3B2C]/10 text-[#0A3B2C] border border-[#0A3B2C]/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Trusted by 200+ Indian MSMEs
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mt-5">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you need more. All plans include core invoice tracking and customer management.
          </p>
          <div className="mt-8 flex justify-center">
            <BillingToggle billing={billing} setBilling={setBilling} />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-4 items-start">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>

        <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-gray-900 text-center">Compare all features</h2>
          <p className="text-center text-gray-500 mt-2">Every plan includes core invoice tracking. Paid plans unlock AI recovery features.</p>
          <div className="mt-8">
            <FeatureComparisonTable billing={billing} />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-gray-900 text-center">Frequently asked questions</h2>
          <p className="text-center text-gray-500 mt-2 mb-8">Everything you need to know about billing</p>
          <div className="max-w-3xl mx-auto">
            <PricingFAQ />
          </div>
        </div>

        {!embedded && (
          <div className="mt-16 text-center">
            <p className="text-gray-600">Ready to recover payments faster?</p>
            <Link to="/register" data-testid="pricing-bottom-cta" className="mt-4 inline-flex">
              <Button className="rounded-lg h-12 px-8 bg-[#0A3B2C] hover:bg-[#072A1F] text-white">
                Start free today <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
