import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppShell from "@/components/app/AppShell";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Payments from "@/pages/Payments";
import FollowupGenerator from "@/pages/FollowupGenerator";
import Cashflow from "@/pages/Cashflow";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import HowToUse from "@/pages/HowToUse";

const PublicHowToUse = () => (
  <div className="min-h-screen bg-[#F9FAFB]">
    <HowToUse />
  </div>
);

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/how-to-use" element={<PublicHowToUse />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/app/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/app/customers" element={<Protected><Customers /></Protected>} />
            <Route path="/app/customers/:id" element={<Protected><CustomerDetail /></Protected>} />
            <Route path="/app/invoices" element={<Protected><Invoices /></Protected>} />
            <Route path="/app/invoices/:id" element={<Protected><InvoiceDetail /></Protected>} />
            <Route path="/app/payments" element={<Protected><Payments /></Protected>} />
            <Route path="/app/followups" element={<Protected><FollowupGenerator /></Protected>} />
            <Route path="/app/cashflow" element={<Protected><Cashflow /></Protected>} />
            <Route path="/app/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/app/how-to-use" element={<Protected><HowToUse /></Protected>} />
            <Route path="/app/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/app/profile" element={<Protected><Profile /></Protected>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
