import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@payguard.ai");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app/dashboard", { replace: true });
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      <div className="hidden lg:flex w-1/2 bg-[#0A3B2C] text-white p-12 flex-col justify-between relative overflow-hidden grain">
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
          <span className="font-display text-xl font-semibold tracking-tight">PayGuard AI</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-medium tracking-tight leading-tight">Recover payments, protect cashflow.</h2>
          <p className="mt-4 text-white/80">Track unpaid invoices, score customer risk, and generate AI follow-ups in seconds.</p>
        </div>
        <p className="text-xs text-white/50 relative z-10">Demo credentials are pre-filled — just click Sign in.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm" data-testid="login-form">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-gray-500 mt-1.5">Welcome back to PayGuard AI.</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input data-testid="login-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>Password</Label>
              <Input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" />
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs text-[#0A3B2C] hover:underline" data-testid="login-forgot-link">Forgot password?</Link>
              </div>
            </div>
          </div>
          <Button data-testid="login-submit-btn" type="submit" disabled={loading} className="w-full h-11 bg-[#0A3B2C] hover:bg-[#072A1F] text-white rounded-lg">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            No account? <Link to="/register" className="text-[#0A3B2C] font-medium hover:underline" data-testid="login-to-register-link">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
