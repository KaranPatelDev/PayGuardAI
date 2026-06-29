import { useAuth } from "@/context/AuthContext";

const KV = ({ label, value }) => (
  <div className="border-b border-gray-100 pb-3 last:border-0">
    <p className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-1">{value || "—"}</p>
  </div>
);

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight" data-testid="profile-title">Profile</h1>
        <p className="text-gray-500 mt-1">Your business and account information.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#0A3B2C] text-white flex items-center justify-center text-2xl font-medium">{user.full_name?.[0]?.toUpperCase()}</div>
        <div><h2 className="font-display text-xl font-medium">{user.full_name}</h2><p className="text-gray-500 text-sm">{user.business_name}</p></div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
        <KV label="Email" value={user.email} />
        <KV label="Phone" value={user.phone} />
        <KV label="Business name" value={user.business_name} />
        <KV label="Business type" value={user.business_type} />
        <KV label="GST number" value={user.gst_number} />
      </div>
    </div>
  );
}
