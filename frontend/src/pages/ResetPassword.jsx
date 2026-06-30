import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex bg-[#F7F8F5]">
        <div className="hidden lg:flex w-1/2 bg-[#0A3B2C] text-white p-12 flex-col justify-between relative overflow-hidden grain">
          <Link to="/" className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
            <span className="font-display text-xl font-semibold tracking-normal">PayGuard AI</span>
          </Link>
          <div className="relative z-10 max-w-md">
            <h2 className="font-display text-4xl font-medium tracking-normal leading-tight">Keep your recovery workspace protected.</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg border border-[#E2E5DD] shadow-sm text-center" data-testid="reset-password-no-token">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-normal">Invalid link</h1>
              <p className="text-sm text-gray-500 mt-2">This password reset link is invalid or missing.</p>
            </div>
            <Link to="/forgot-password">
              <Button className="w-full h-11 bg-[#0A3B2C] hover:bg-[#072A1F] text-white rounded-lg">Request a new link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid or expired link");
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
          <h2 className="font-display text-4xl font-medium tracking-normal leading-tight">Set a new password and continue recovery work.</h2>
          <p className="mt-4 text-white/80">Get back to invoices, reminders, and payment proof without losing context.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {success ? (
          <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg border border-[#E2E5DD] shadow-sm text-center" data-testid="reset-password-success">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-normal">Password reset</h1>
              <p className="text-sm text-gray-500 mt-2">Redirecting you to sign in…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg border border-[#E2E5DD] shadow-sm" data-testid="reset-password-form">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-normal">Set new password</h1>
              <p className="text-sm text-gray-500 mt-1.5">Choose a strong password for your account.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>New password</Label>
                <Input data-testid="reset-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5" />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input data-testid="reset-confirm-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="mt-1.5" />
              </div>
            </div>
            <Button data-testid="reset-submit-btn" type="submit" disabled={loading} className="w-full h-11 bg-[#0A3B2C] hover:bg-[#072A1F] text-white rounded-lg">
              {loading ? "Resetting…" : "Reset password"}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              <Link to="/login" className="text-[#0A3B2C] font-medium hover:underline inline-flex items-center gap-1" data-testid="reset-to-login-link">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
