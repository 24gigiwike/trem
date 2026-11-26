import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, ClipboardList, CreditCard, LogOut, ShieldCheck, Users, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AuditLogEntry, PaymentOrder, PropertyListing, UserAccount } from '../../shared/types';
import { TremLogo } from '../../components/TremLogo';

interface AdminVendorRow {
  id: string;
  businessName: string;
  representativeName: string;
  entityType: string;
  email: string;
  phone: string;
  rcNumber: string;
  scumlNumber: string;
  verificationStatus: string;
  documents: Array<{ id: string; docLabel: string; fileName: string; status: string }>;
}

export function AdminConsolePage() {
  const { user, apiFetch, setAuthSession, logout } = useApp();
  const navigate = useNavigate();

  const [adminStatus, setAdminStatus] = useState<{ envConfigured: boolean; claimed: boolean } | null>(null);
  const [adminEmail, setAdminEmail] = useState('admin@trem.ng');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<'overview' | 'vendors' | 'listings' | 'users' | 'commercial' | 'audit'>('overview');
  const [metrics, setMetrics] = useState({
    usersCount: 0,
    vendorsPending: 0,
    listingsPending: 0,
    listingsPublished: 0,
    revenueNgn: 0,
    enquiriesCount: 0,
  });
  const [vendors, setVendors] = useState<AdminVendorRow[]>([]);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [orders, setOrders] = useState<Array<PaymentOrder & { business_name?: string }>>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    apiFetch<{ envConfigured: boolean; claimed: boolean }>('/api/auth/admin-status')
      .then(setAdminStatus)
      .catch(() => {});
  }, [apiFetch]);

  const loadAdminData = () => {
    if (!isAdmin) return;
    Promise.all([
      apiFetch<{ metrics: typeof metrics }>('/api/admin/overview'),
      apiFetch<{ vendors: AdminVendorRow[] }>('/api/admin/vendors'),
      apiFetch<{ listings: PropertyListing[] }>('/api/admin/listings'),
      apiFetch<{ users: UserAccount[] }>('/api/admin/users'),
      apiFetch<{ orders: Array<PaymentOrder & { business_name?: string }> }>('/api/admin/commercial'),
      apiFetch<{ logs: AuditLogEntry[] }>('/api/admin/audit-logs'),
    ])
      .then(([m, v, l, u, c, a]) => {
        setMetrics(m.metrics);
        setVendors(v.vendors);
        setListings(l.listings);
        setUsers(u.users);
        setOrders(c.orders);
        setLogs(a.logs);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await apiFetch<{ token: string; user: UserAccount }>('/api/auth/admin-access', {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail, passcode }),
      });
      await setAuthSession(res.token, res.user);
      setPasscode('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Admin authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyVendor = async (vendorId: string, decision: 'verified' | 'rejected') => {
    await apiFetch(`/api/admin/vendors/${vendorId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        notes: decision === 'verified' ? 'Approved by TREM Compliance Desk.' : 'Additional CAC / SCUML documentation required.',
      }),
    });
    loadAdminData();
  };

  const handleModerateListing = async (propertyId: string, status: 'published' | 'rejected' | 'suspended') => {
    await apiFetch(`/api/admin/listings/${propertyId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    loadAdminData();
  };

  const handleUserStatus = async (userId: string, status: 'active' | 'suspended') => {
    await apiFetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    loadAdminData();
  };

  if (!isAdmin) {
    const firstRunClaim = adminStatus && !adminStatus.envConfigured && !adminStatus.claimed;
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg border border-[#DCE3F0] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <TremLogo subtitle="Admin Governance" />
            <Link to="/" className="text-xs font-bold text-[#1B3688] hover:underline">Marketplace</Link>
          </div>

          <div>
            <h1 className="font-display font-extrabold text-xl text-[#0B1B48]">
              {firstRunClaim ? 'Claim Platform Administrator Console' : 'Platform Administrator Sign-In'}
            </h1>
            <p className="text-xs text-[#5A6782] mt-1">
              {firstRunClaim
                ? 'First-run setup: choose an administrator passcode (minimum 8 characters) to lock and claim admin governance.'
                : 'Enter the server-configured or claimed administrator passcode.'}
            </p>
          </div>

          <form onSubmit={handleAdminAccess} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">Administrator Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {firstRunClaim ? 'Create Admin Passcode (min 8 chars)' : 'Administrator Passcode'}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
              />
            </div>
            {authError && <p className="text-xs font-bold text-red-600">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold"
            >
              {authLoading ? 'Authenticating...' : firstRunClaim ? 'Claim & Open Admin Console' : 'Access Admin Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0B1B48]">
      <header className="bg-[#071336] text-white h-16 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <TremLogo dark subtitle="Admin Governance" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs font-semibold text-slate-300 hover:text-white">Public Site</Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview', icon: ClipboardList },
            { key: 'vendors', label: `Vendor KYC (${metrics.vendorsPending} Pending)`, icon: ShieldCheck },
            { key: 'listings', label: `Listing Moderation (${metrics.listingsPending} Pending)`, icon: Building2 },
            { key: 'users', label: `Users (${metrics.usersCount})`, icon: Users },
            { key: 'commercial', label: 'Commercial & Orders', icon: CreditCard },
            { key: 'audit', label: 'Audit Logs', icon: ClipboardList },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key as typeof tab)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold border ${
                  tab === t.key ? 'bg-[#0B1B48] text-white border-[#0B1B48]' : 'bg-white text-[#334155] border-[#DCE3F0]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Registered Users', val: metrics.usersCount },
              { label: 'Pending Vendor KYC Reviews', val: metrics.vendorsPending },
              { label: 'Pending Listing Moderations', val: metrics.listingsPending },
              { label: 'Published Active Listings', val: metrics.listingsPublished },
              { label: 'Verified Platform Revenue', val: `₦${metrics.revenueNgn.toLocaleString()}` },
              { label: 'Total Buyer Enquiries', val: metrics.enquiriesCount },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-lg border border-[#DCE3F0] p-5">
                <div className="text-xs font-bold text-[#5A6782]">{m.label}</div>
                <div className="font-display font-extrabold text-3xl text-[#0B1B48] mt-1 tabular-nums">{m.val}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'vendors' && (
          <div className="bg-white rounded-lg border border-[#DCE3F0] divide-y divide-[#DCE3F0]">
            {vendors.map((v) => (
              <div key={v.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base">{v.businessName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.verificationStatus === 'verified'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : v.verificationStatus === 'pending'
                          ? 'bg-[#FEF9C3] text-[#0B1B48]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {v.verificationStatus}
                    </span>
                  </div>
                  <div className="text-xs text-[#5A6782]">
                    {v.representativeName} ({v.entityType}) · {v.email} · {v.phone}
                  </div>
                  <div className="text-xs font-mono text-[#1B3688]">
                    RC: {v.rcNumber || 'N/A'} · SCUML: {v.scumlNumber || 'N/A'} · Docs: {v.documents.length}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleVerifyVendor(v.id, 'verified')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-bold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve KYC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyVendor(v.id, 'rejected')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'listings' && (
          <div className="bg-white rounded-lg border border-[#DCE3F0] divide-y divide-[#DCE3F0]">
            {listings.map((p) => (
              <div key={p.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#1B3688]">{p.refCode}</span>
                    <span className="px-2 py-0.5 rounded bg-[#EEF2FA] font-bold uppercase text-[10px]">{p.status}</span>
                    <span className="text-[#5A6782]">by {p.vendorName}</span>
                  </div>
                  <div className="font-display font-bold text-base mt-1">{p.title}</div>
                  <div className="text-xs text-[#5A6782]">
                    ₦{p.priceNgn.toLocaleString()} · {p.titleDocType} · {p.city}, {p.state}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModerateListing(p.id, 'published')}
                    className="px-3.5 py-2 rounded-lg bg-[#16A34A] text-white text-xs font-bold"
                  >
                    Approve & Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerateListing(p.id, 'rejected')}
                    className="px-3.5 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerateListing(p.id, 'suspended')}
                    className="px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-bold"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-lg border border-[#DCE3F0] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#DCE3F0] text-[#5A6782] uppercase">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3F0]">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 font-bold">{u.firstName} {u.lastName}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4 uppercase font-bold text-[#1B3688]">{u.role}</td>
                    <td className="py-3 px-4 uppercase font-bold">{u.status}</td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleUserStatus(u.id, u.status === 'active' ? 'suspended' : 'active')}
                          className="px-3 py-1 rounded bg-[#EEF2FA] text-[#0B1B48] font-bold"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'commercial' && (
          <div className="bg-white rounded-lg border border-[#DCE3F0] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6FA] border-b border-[#DCE3F0] text-[#5A6782] uppercase">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount (NGN)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3F0]">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 px-4 font-mono font-bold">{o.reference}</td>
                    <td className="py-3 px-4">{o.business_name}</td>
                    <td className="py-3 px-4 uppercase">{(o as unknown as { order_type: string }).order_type || o.orderType}</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      ₦{Number((o as unknown as { total_ngn: number }).total_ngn ?? o.totalNgn).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 uppercase font-bold">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'audit' && (
          <div className="bg-white rounded-lg border border-[#DCE3F0] divide-y divide-[#DCE3F0]">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5A6782]">No administrative actions logged yet.</div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#0B1B48]">{l.action}</span>
                    <span className="text-[#5A6782] ml-2">
                      {l.targetType} ({l.targetId}) {l.details && `· ${l.details}`}
                    </span>
                  </div>
                  <span className="text-[#5A6782] tabular-nums">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
