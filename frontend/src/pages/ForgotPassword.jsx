import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8F5]">
      <div className="hidden lg:flex w-1/2 bg-[#0A3B2C] text-white p-12 flex-col justify-between relative overflow-hidden grain">
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
          <span className="font-display text-xl font-semibold tracking-normal">PayGuard AI</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-medium tracking-normal leading-tight">Keep your recovery workspace protected.</h2>
          <p className="mt-4 text-white/80">Reset your password and return to invoices, reminders, and payment proof.</p>
        </div>
        <p className="text-xs text-white/50 relative z-10">We will send a reset link to your registered email.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {sent ? (
          <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg border border-[#E2E5DD] shadow-sm text-center" data-testid="forgot-password-success">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-normal">Check your email</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                We sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
                The link will expire in 15 minutes.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>
            <Link to="/login">
              <Button variant="ghost" className="w-full h-11 rounded-lg">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg border border-[#E2E5DD] shadow-sm" data-testid="forgot-password-form">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-normal">Forgot password?</h1>
              <p className="text-sm text-gray-500 mt-1.5">Enter your email and we will send you a reset link.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input data-testid="forgot-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="mt-1.5" />
              </div>
            </div>
            <Button data-testid="forgot-submit-btn" type="submit" disabled={loading} className="w-full h-11 bg-[#0A3B2C] hover:bg-[#072A1F] text-white rounded-lg">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Remember your password? <Link to="/login" className="text-[#0A3B2C] font-medium hover:underline" data-testid="forgot-to-login-link">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
