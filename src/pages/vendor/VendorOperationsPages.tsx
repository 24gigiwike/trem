import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Plus, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AgencyTeamMember, EnquiryRecord, KycDocument, PaymentOrder, SubscriptionRecord } from '../../shared/types';
import { PortalShell } from '../../components/PortalShell';

export function VendorLeadsPage() {
  const { apiFetch } = useApp();
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [filter, setFilter] = useState('all');

  const load = () => {
    apiFetch<{ enquiries: EnquiryRecord[] }>('/api/vendor/enquiries')
      .then((res) => setEnquiries(res.enquiries))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: EnquiryRecord['status']) => {
    await apiFetch(`/api/vendor/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  };

  const visible = filter === 'all' ? enquiries : enquiries.filter((e) => e.status === filter);

  return (
    <PortalShell title="Leads & Inquiries">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-[#0B1B48]">Leads & Inspection Bookings</h1>
            <p className="text-xs text-[#5A6782]">Manage incoming buyer enquiries and inspection requests across Nigeria.</p>
          </div>
          <div className="flex gap-1.5">
            {['all', 'new', 'responded', 'scheduled', 'closed'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize border ${
                  filter === s ? 'bg-[#0B1B48] text-white border-[#0B1B48]' : 'bg-white text-[#334155] border-[#DCE3F0]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#DCE3F0] overflow-hidden">
          {visible.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5A6782]">No enquiries matching this status.</div>
          ) : (
            <div className="divide-y divide-[#DCE3F0]">
              {visible.map((lead) => (
                <div key={lead.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold text-base text-[#0B1B48]">{lead.fullName}</span>
                      <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] text-[10px] font-bold uppercase">
                        {lead.enquiryType}
                      </span>
                      <span className="text-xs text-[#5A6782]">{new Date(lead.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#1B3688]">
                      {lead.propertyRef ? `${lead.propertyRef} — ` : ''}{lead.propertyTitle}
                    </div>
                    <div className="text-xs text-[#334155]">
                      {lead.email} · {lead.phone}
                      {lead.inspectionDate && ` · Requested: ${lead.inspectionDate} (${lead.inspectionSession}, ${lead.tourPreference})`}
                    </div>
                    {lead.message && <p className="text-xs text-[#5A6782] italic">&ldquo;{lead.message}&rdquo;</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-[#22C55E] text-white text-xs font-bold"
                    >
                      WhatsApp
                    </a>
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value as EnquiryRecord['status'])}
                      className="px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs font-bold"
                    >
                      <option value="new">New</option>
                      <option value="responded">Responded</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

export function VendorBillingPage() {
  const { apiFetch } = useApp();
  const [sub, setSub] = useState<SubscriptionRecord | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);

  useEffect(() => {
    apiFetch<{ subscription: SubscriptionRecord | null; orders: PaymentOrder[] }>('/api/billing/overview')
      .then((res) => {
        setSub(res.subscription);
        setOrders(res.orders);
      })
      .catch(() => {});
  }, [apiFetch]);

  return (
    <PortalShell title="Subscription & Billing">
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-[#DCE3F0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Current Entitlement</span>
            <h1 className="font-display font-extrabold text-2xl text-[#0B1B48] mt-1">
              {sub ? `${sub.planCode === 'premium' ? 'Premium Package' : 'Standard Package'} (${sub.billingMonths} Months)` : 'No Active Subscription'}
            </h1>
            {sub && (
              <p className="text-xs text-[#5A6782] mt-1">
                Active through {new Date(sub.expiresAt).toLocaleDateString()} · Auto-renew {sub.autoRenew ? 'Enabled' : 'Disabled'}
              </p>
            )}
          </div>
          <Link to="/vendor/onboarding" className="px-5 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold whitespace-nowrap">
            Upgrade / Renew Subscription
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-[#DCE3F0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DCE3F0]">
            <h2 className="font-display font-bold text-base text-[#0B1B48]">Payment History</h2>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5A6782]">No payment orders recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#DCE3F0] text-[#5A6782] uppercase">
                  <tr>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Order Type</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Total (NGN)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3F0]">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-3 px-4 font-mono font-bold text-[#0B1B48]">{o.reference}</td>
                      <td className="py-3 px-4 capitalize">{o.orderType}</td>
                      <td className="py-3 px-4 capitalize">{o.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums">₦{o.totalNgn.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            o.status === 'verified' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF9C3] text-[#0B1B48]'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#5A6782] tabular-nums">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

export function VendorKycPage() {
  const { apiFetch, refreshSession } = useApp();
  const [status, setStatus] = useState('unverified');
  const [notes, setNotes] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [scumlNumber, setScumlNumber] = useState('');
  const [docs, setDocs] = useState<KycDocument[]>([]);
  const [pendingDocs, setPendingDocs] = useState<Array<{ docType: 'representative_id' | 'cac_cert' | 'scuml_cert'; docLabel: string; fileName: string; fileUrl: string }>>([]);
  const [msg, setMsg] = useState('');

  const load = () => {
    apiFetch<{ verificationStatus: string; verificationNotes: string; rcNumber: string; tinNumber: string; scumlNumber: string; documents: KycDocument[] }>('/api/vendor/kyc')
      .then((res) => {
        setStatus(res.verificationStatus);
        setNotes(res.verificationNotes);
        setRcNumber(res.rcNumber);
        setTinNumber(res.tinNumber);
        setScumlNumber(res.scumlNumber);
        setDocs(res.documents);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'representative_id' | 'cac_cert' | 'scuml_cert', docLabel: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const base64: string = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Read error'));
      reader.readAsDataURL(file);
    });
    const res = await apiFetch<{ fileName: string; fileUrl: string }>('/api/uploads', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, dataBase64: base64 }),
    });
    setPendingDocs((prev) => [...prev, { docType, docLabel, fileName: res.fileName, fileUrl: res.fileUrl }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/vendor/kyc', {
      method: 'POST',
      body: JSON.stringify({ rcNumber, tinNumber, scumlNumber, documents: pendingDocs }),
    });
    setPendingDocs([]);
    setMsg('Verification documents submitted for admin review.');
    await refreshSession();
    load();
  };

  return (
    <PortalShell title="Verification & KYC">
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-[#DCE3F0] p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Accreditation Status</span>
            <h1 className="font-display font-extrabold text-2xl text-[#0B1B48] mt-1 capitalize">{status}</h1>
            {notes && <p className="text-xs text-[#5A6782] mt-1">{notes}</p>}
          </div>
          <span
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase ${
              status === 'verified' ? 'bg-[#DCFCE7] text-[#15803D]' : status === 'pending' ? 'bg-[#FEF9C3] text-[#0B1B48]' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {status}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0B1B48] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1B3688]" />
            <span>Submit / Update Corporate & Identity Credentials</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">CAC Registration Number</label>
              <input type="text" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Federal Tax ID (TIN)</label>
              <input type="text" value={tinNumber} onChange={(e) => setTinNumber(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">SCUML / License No</label>
              <input type="text" value={scumlNumber} onChange={(e) => setScumlNumber(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'representative_id' as const, label: 'Representative Govt ID' },
              { type: 'cac_cert' as const, label: 'CAC Certificate' },
              { type: 'scuml_cert' as const, label: 'SCUML / REDAN Certificate' },
            ].map((item) => (
              <label key={item.type} className="flex items-center justify-center gap-2 p-4 rounded-md border border-dashed border-[#1B3688]/40 bg-[#F4F6FA] cursor-pointer text-xs font-bold text-[#1B3688]">
                <UploadCloud className="w-4 h-4" />
                <span>Upload {item.label}</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleUpload(e, item.type, item.label)} className="hidden" />
              </label>
            ))}
          </div>

          {pendingDocs.length > 0 && (
            <div className="text-xs text-[#16A34A] font-semibold">
              Ready to submit: {pendingDocs.map((d) => d.fileName).join(', ')}
            </div>
          )}

          {msg && <div className="p-3 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-bold">{msg}</div>}

          <button type="submit" className="px-5 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
            Submit KYC Package
          </button>
        </form>

        {docs.length > 0 && (
          <div className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-3">
            <h3 className="font-display font-bold text-base text-[#0B1B48]">Submitted Documents</h3>
            <div className="divide-y divide-[#DCE3F0] text-xs">
              {docs.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0B1B48]">{d.docLabel}</span>
                    <span className="text-[#5A6782] ml-2">{d.fileName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] font-bold uppercase text-[10px]">{d.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

export function VendorSettingsPage() {
  const { vendorProfile, apiFetch, refreshSession } = useApp();
  const [businessName, setBusinessName] = useState(vendorProfile?.businessName || '');
  const [address, setAddress] = useState(vendorProfile?.address || '');
  const [abujaAddress, setAbujaAddress] = useState(vendorProfile?.abujaAddress || '');
  const [bio, setBio] = useState(vendorProfile?.bio || '');
  const [savedMsg, setSavedMsg] = useState('');

  const [team, setTeam] = useState<AgencyTeamMember[]>([]);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCreds, setNewCreds] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const loadTeam = () => {
    apiFetch<{ team: AgencyTeamMember[] }>('/api/vendor/team')
      .then((res) => setTeam(res.team))
      .catch(() => {});
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/vendor/profile', {
      method: 'PATCH',
      body: JSON.stringify({ businessName, address, abujaAddress, bio }),
    });
    await refreshSession();
    setSavedMsg('Agency profile updated.');
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTitle.trim()) return;
    await apiFetch('/api/vendor/team', {
      method: 'POST',
      body: JSON.stringify({ fullName: newName, title: newTitle, credentials: newCreds, phone: newPhone }),
    });
    setNewName('');
    setNewTitle('');
    setNewCreds('');
    setNewPhone('');
    loadTeam();
  };

  const handleDeleteTeam = async (id: string) => {
    await apiFetch(`/api/vendor/team/${id}`, { method: 'DELETE' });
    loadTeam();
  };

  return (
    <PortalShell title="Agency Settings">
      <div className="space-y-6">
        <form onSubmit={handleSaveProfile} className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
          <h1 className="font-display font-extrabold text-xl text-[#0B1B48]">Agency & Microsite Profile</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Business Name</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Head Office Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Secondary Branch Address (Optional)</label>
            <input type="text" value={abujaAddress} onChange={(e) => setAbujaAddress(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Brokerage Overview / Bio</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
          </div>
          {savedMsg && (
            <div className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedMsg}</span>
            </div>
          )}
          <button type="submit" className="px-5 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
            Save Agency Settings
          </button>
        </form>

        {/* Team Management */}
        <div className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0B1B48]">Lead Brokers & Compliance Team</h2>

          <div className="divide-y divide-[#DCE3F0]">
            {team.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-[#0B1B48]">{m.fullName}</div>
                  <div className="text-[#5A6782]">{m.title} · {m.credentials}</div>
                </div>
                <button type="button" onClick={() => handleDeleteTeam(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTeam} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#DCE3F0]">
            <input type="text" required placeholder="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs" />
            <input type="text" required placeholder="Role / Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs" />
            <input type="text" placeholder="Credentials (e.g. NBA)" value={newCreds} onChange={(e) => setNewCreds(e.target.value)} className="px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs" />
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-[#E8C547] text-[#0B1B48] text-xs font-bold">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Team Member</span>
            </button>
          </form>
        </div>
      </div>
    </PortalShell>
  );
}
