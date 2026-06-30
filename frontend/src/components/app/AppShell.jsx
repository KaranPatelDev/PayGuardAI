import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, FileText, Wallet, Sparkles,
  TrendingUp, FileBarChart, Settings as SettingsIcon, LogOut, ShieldCheck, HelpCircle, Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const nav = [
  { to: "/app/dashboard",    label: "Dashboard",       icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/app/customers",    label: "Customers",       icon: Users,           testid: "nav-customers" },
  { to: "/app/invoices",     label: "Invoices",        icon: FileText,        testid: "nav-invoices" },
  { to: "/app/payments",     label: "Payments",        icon: Wallet,          testid: "nav-payments" },
  { to: "/app/followups",    label: "AI Follow-ups",   icon: Sparkles,        testid: "nav-followups" },
  { to: "/app/cashflow",     label: "Cashflow",        icon: TrendingUp,      testid: "nav-cashflow" },
  { to: "/app/reports",      label: "Reports",         icon: FileBarChart,    testid: "nav-reports" },
  { to: "/app/how-to-use",   label: "How to Use",      icon: HelpCircle,      testid: "nav-how-to-use" },
  { to: "/app/settings",     label: "Settings",        icon: SettingsIcon,    testid: "nav-settings" },
];

function SidebarNav({ onNavClick }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => { logout(); navigate("/"); };

  return (
    <>
      <div className="h-16 px-6 flex items-center border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-[#0A3B2C] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="ml-2.5 font-display text-lg font-semibold tracking-tight text-gray-900">PayGuard AI</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            data-testid={n.testid}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#0A3B2C] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            <n.icon className="w-4 h-4" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <button
          data-testid="btn-logout"
          onClick={() => { doLogout(); onNavClick?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
    </>
  );
}

export default function AppShell({ children }) {
  const { user } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white hidden md:flex flex-col" data-testid="app-sidebar">
        <SidebarNav />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 bg-white/70 backdrop-blur-xl sticky top-0 z-40 flex items-center px-4 sm:px-6 justify-between gap-3">
          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100" data-testid="mobile-menu-btn" aria-label="Open menu">
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav onNavClick={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium truncate">{user?.business_name}</p>
            <p className="text-sm font-display font-medium text-gray-900 truncate">{user?.business_type || "Business"}</p>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/app/profile" data-testid="nav-profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 rounded-full bg-[#0A3B2C] text-white flex items-center justify-center text-sm font-medium shrink-0">
                {user?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-gray-900 hidden sm:inline">{user?.full_name}</span>
            </NavLink>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
