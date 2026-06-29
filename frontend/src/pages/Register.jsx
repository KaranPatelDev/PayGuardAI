import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", business_name: "", business_type: "", gst_number: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created!");
      navigate("/app/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-xl bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6" data-testid="register-form">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#0A3B2C] flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-white" /></div>
          <span className="font-display text-xl font-semibold tracking-tight">PayGuard AI</span>
        </Link>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1.5">Start recovering payments in minutes.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="mt-1.5" data-testid="register-full-name" /></div>
          <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1.5" data-testid="register-email" /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5" data-testid="register-phone" /></div>
          <div><Label>Business name</Label><Input required value={form.business_name} onChange={(e) => set("business_name", e.target.value)} className="mt-1.5" data-testid="register-business-name" /></div>
          <div><Label>Business type</Label><Input value={form.business_type} onChange={(e) => set("business_type", e.target.value)} className="mt-1.5" data-testid="register-business-type" placeholder="Trader / Mfg / Services" /></div>
          <div><Label>GST number (optional)</Label><Input value={form.gst_number} onChange={(e) => set("gst_number", e.target.value)} className="mt-1.5" data-testid="register-gst" /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} className="mt-1.5" data-testid="register-password" /></div>
        </div>
        <Button data-testid="register-submit-btn" type="submit" disabled={loading} className="w-full h-11 bg-[#0A3B2C] hover:bg-[#072A1F] text-white rounded-lg">
          {loading ? "Creating…" : "Create account"}
        </Button>
        <p className="text-sm text-gray-500 text-center">Already have one? <Link to="/login" className="text-[#0A3B2C] font-medium hover:underline">Sign in</Link></p>
      </form>
    </div>
  );
}
