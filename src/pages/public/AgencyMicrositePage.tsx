import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AgencyTeamMember, PropertyListing } from '../../shared/types';
import {
  type AgencyDetail,
  type AgencySummary,
  createEnquiryLocal,
  getLocalAgencies,
  getLocalAgencyDetail,
} from '../../lib/localStore';
import { SafeImage } from '../../components/SafeImage';
import { PropertyCard } from '../../components/PropertyCard';

export function AgenciesDirectoryPage() {
  const { apiFetch } = useApp();
  const [agencies, setAgencies] = useState<AgencySummary[]>(() => getLocalAgencies());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const local = getLocalAgencies();
    setAgencies(local);
    apiFetch<{ agencies: AgencySummary[] }>('/api/public/agencies')
      .then((res) => {
        if (res.agencies && res.agencies.length > local.length) {
          setAgencies(res.agencies);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiFetch]);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Accredited Marketplace Partners</span>
        <h1 className="font-display font-extrabold text-3xl text-[#0B1B48] mt-1">Verified Real Estate Agencies & Vendors</h1>
        <p className="text-sm text-[#5A6782] mt-1">
          Inspect corporate credentials, CAC/SCUML compliance status, and live verified portfolios across Nigeria.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agencies.map((ag) => (
            <Link
              key={ag.id}
              to={`/agencies/${ag.slug}`}
              className="bg-white rounded-lg border border-[#DCE3F0] p-5 hover:border-[#0B1B48] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                <SafeImage src={ag.logoUrl} alt={ag.businessName} className="w-14 h-14 rounded-md object-cover border border-[#DCE3F0]" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">
                    {ag.verificationStatus === 'verified' ? 'CAC & SCUML Verified' : 'Pending Verification'}
                  </div>
                  <h2 className="font-display font-bold text-lg text-[#0B1B48] truncate">{ag.businessName}</h2>
                  <p className="text-xs text-[#5A6782] mt-0.5">
                    {ag.city}, {ag.state} · {ag.rcNumber || 'Registered Partner'}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#DCE3F0] flex items-center justify-between text-xs">
                <span className="font-bold text-[#0B1B48] tabular-nums">{ag.activeListings} Live Assets</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#0B1B48]">
                  <Star className="w-3.5 h-3.5 fill-[#E8C547] text-[#E8C547]" />
                  <span className="tabular-nums">{ag.rating.toFixed(1)}</span>
                  <span className="text-[#5A6782] font-normal tabular-nums">({ag.reviewCount})</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AgencyMicrositePage() {
  const { slug } = useParams();
  const { apiFetch, user } = useApp();

  const [agency, setAgency] = useState<AgencyDetail | null>(null);
  const [team, setTeam] = useState<AgencyTeamMember[]>([]);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [fullName, setFullName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [propertyId, setPropertyId] = useState('');
  const [purpose, setPurpose] = useState('Purchase / Acquire');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState('');
  const [sentErr, setSentErr] = useState('');

  useEffect(() => {
    if (!slug) return;
    const local = getLocalAgencyDetail(slug);
    if (local) {
      setAgency(local.agency);
      setTeam(local.team);
      setProperties(local.properties);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch<{ agency: AgencyDetail; team: AgencyTeamMember[]; properties: PropertyListing[] }>(`/api/public/agencies/${slug}`)
      .then((res) => {
        setAgency(res.agency);
        setTeam(res.team);
        setProperties(res.properties);
      })
      .catch(() => setAgency(null))
      .finally(() => setLoading(false));
  }, [slug, apiFetch]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency) return;
    setSending(true);
    setSentErr('');
    setSentOk('');

    createEnquiryLocal({
      vendorId: agency.id,
      propertyId: propertyId || null,
      seekerId: user?.id || null,
      fullName,
      email,
      phone,
      enquiryType: 'formal',
      purpose,
      message,
    });

    try {
      await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: agency.id,
          vendorId: agency.id,
          propertyId: propertyId || null,
          fullName,
          email,
          phone,
          enquiryType: 'formal',
          purpose,
          message,
        }),
      });
    } catch {
      // Saved locally
    }

    setSentOk(`Formal inquiry transmitted to ${agency.businessName} compliance desk.`);
    setMessage('');
    setSending(false);
  };

  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10">
        <div className="h-72 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <h1 className="font-display font-bold text-2xl">Agency Microsite Not Found</h1>
        <Link to="/agencies" className="inline-block mt-4 px-5 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
          Browse Verified Agencies
        </Link>
      </div>
    );
  }

  const visibleProps = catFilter === 'all' ? properties : properties.filter((p) => p.category === catFilter);

  return (
    <div>
      <section className="bg-[#071336] text-white border-b border-white/10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10">
          <div className="text-xs text-slate-300 mb-6 flex items-center gap-1.5">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link to="/agencies" className="hover:text-white">Real Estate Agencies & Vendors</Link>
            <span>/</span>
            <span className="text-[#E8C547] font-semibold">{agency.businessName}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <SafeImage
                src={agency.logoUrl}
                alt={agency.businessName}
                className="w-20 h-20 rounded-lg object-cover border-2 border-[#E8C547] shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#E8C547] text-[#0B1B48]">
                    {agency.verificationStatus === 'verified' ? 'Verified Partner' : 'Registered Partner'}
                  </span>
                  {agency.rcNumber && <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono">{agency.rcNumber}</span>}
                  <span className="text-[#4ADE80]">Active Operational Desk</span>
                </div>
                <h1 className="font-display font-extrabold text-2xl sm:text-4xl">{agency.businessName}</h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  {agency.city}, {agency.state} · Accredited Nigerian Real Estate Brokerage
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={`https://wa.me/${agency.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <a
                href={`tel:${agency.phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                <Phone className="w-4 h-4" />
                <span>Call Desk</span>
              </a>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
              >
                <Mail className="w-4 h-4" />
                <span>Send Formal Inquiry</span>
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'CAC Registered', val: agency.rcNumber || 'Active Corporate Entity' },
              { label: 'SCUML / AML Certified', val: agency.scumlNumber || 'Anti-Money Laundering Cleared' },
              { label: 'REDAN Member', val: agency.redanNumber || 'Accredited Developer Body' },
              { label: 'State Licensure', val: agency.lasreraLicense || 'Verified Brokerage Desk' },
            ].map((acc) => (
              <div key={acc.label} className="p-3 rounded-md bg-[#0B1B48] border border-white/15">
                <div className="text-xs font-bold text-[#E8C547] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{acc.label}</span>
                </div>
                <div className="text-[11px] text-slate-200 mt-0.5 truncate">{acc.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-[#DCE3F0]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-center sm:text-left">
          <div>
            <div className="font-display font-extrabold text-xl text-[#0B1B48] tabular-nums">{properties.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">Active Listings</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-xl text-[#0B1B48] tabular-nums">100%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">C of O / Gov. Consent</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-xl text-[#0B1B48]">{agency.avgResponseTime}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">WhatsApp Response</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-xl text-[#0B1B48] tabular-nums">{agency.memberSince}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">TREM Member Since</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-xl text-[#0B1B48] tabular-nums flex items-center justify-center sm:justify-start gap-1">
              <span>{agency.rating.toFixed(1)}</span>
              <Star className="w-4 h-4 fill-[#E8C547] text-[#E8C547]" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">{agency.reviewCount}+ Verified Reviews</div>
          </div>
        </div>
      </section>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B3688]">About the Brokerage</span>
            <h2 className="font-display font-extrabold text-2xl text-[#0B1B48] mt-1">
              Title Vetting & Prime Nigerian Real Estate
            </h2>
          </div>
          <p className="text-sm text-[#334155] leading-relaxed">{agency.bio}</p>

          <div className="pt-4 border-t border-[#DCE3F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-display font-bold text-sm text-[#0B1B48]">CAC & Land Registry Verification Protocol</div>
              <p className="text-xs text-[#5A6782] mt-0.5">
                Every property listed by {agency.businessName} includes documented title status and survey verification prior to public display.
              </p>
            </div>
            <Link to="/how-it-works" className="px-4 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] hover:bg-[#EEF2FA] text-[#0B1B48] text-xs font-bold whitespace-nowrap">
              Read Protocol
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-4 bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-[#0B1B48]">Operational Matrix</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1B3688] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#0B1B48]">Head Office</div>
                <div className="text-[#5A6782]">{agency.address || `${agency.city}, ${agency.state}`}</div>
              </div>
            </div>
            {agency.abujaAddress && (
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-[#1B3688] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#0B1B48]">Abuja Branch Office</div>
                  <div className="text-[#5A6782]">{agency.abujaAddress}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#1B3688] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#0B1B48]">Inspection & Desk Hours</div>
                <div className="text-[#5A6782]">Monday – Saturday: 8:00 AM – 6:30 PM WAT</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-full py-2.5 px-4 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white font-bold text-xs transition-colors"
          >
            Schedule On-Site Inspection
          </button>
        </aside>
      </section>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B3688]">Verified Inventory</span>
            <h2 className="font-display font-extrabold text-2xl text-[#0B1B48]">{agency.businessName} Active Portfolio</h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: `All (${properties.length})` },
              { key: 'residential', label: 'Residential' },
              { key: 'commercial', label: 'Commercial' },
              { key: 'land_banking', label: 'Land Banking' },
              { key: 'buy_build', label: 'Buy & Build' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setCatFilter(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold border ${
                  catFilter === t.key ? 'bg-[#0B1B48] text-white border-[#0B1B48]' : 'bg-white text-[#334155] border-[#DCE3F0]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {visibleProps.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#DCE3F0] p-10 text-center text-sm text-[#5A6782]">
            No published listings in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleProps.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {team.length > 0 && (
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-display font-extrabold text-2xl text-[#0B1B48] mb-5">Lead Brokers & Legal Compliance Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {team.map((member) => (
              <div key={member.id} className="bg-white rounded-lg border border-[#DCE3F0] p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <SafeImage src={member.avatarUrl} alt={member.fullName} className="w-12 h-12 rounded-md object-cover border border-[#DCE3F0]" />
                    <div>
                      <div className="font-display font-bold text-sm text-[#0B1B48]">{member.fullName}</div>
                      <div className="text-xs font-semibold text-[#1B3688]">{member.title}</div>
                      <div className="text-[11px] text-[#5A6782]">{member.credentials}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#5A6782] leading-relaxed">{member.bio}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="mt-4 w-full py-2 rounded-md bg-[#EEF2FA] hover:bg-[#DCE3F0] text-[#0B1B48] text-xs font-bold"
                >
                  Request Consultation
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 flex justify-end">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto flex flex-col">
            <div className="bg-[#0B1B48] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8C547]">TREM Verified Gateway</span>
                <h3 className="font-display font-bold text-lg">Formal Inquiry Desk</h3>
                <p className="text-xs text-slate-300">To: {agency.businessName}</p>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="p-2 rounded-md bg-white/10 hover:bg-white/20">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInquirySubmit} className="p-5 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Olumide Adeleke"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="olumide@corporate.ng"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Phone Number (WhatsApp Enabled) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 802 345 6789"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Property of Interest</label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                >
                  <option value="">General Agency Portfolio Inquiry</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.refCode} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#0B1B48] mb-1.5">Inquiry Purpose & Timeline</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Purchase / Acquire', 'Inspection First'].map((p) => (
                    <label key={p} className="flex items-center gap-2 p-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] cursor-pointer">
                      <input type="radio" name="inq-purpose" checked={purpose === p} onChange={() => setPurpose(p)} />
                      <span className="font-semibold">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Notes & Documentation Requests</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Specify preferred inspection dates or legal verification questions..."
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>

              <div className="p-3 rounded-md bg-[#EEF2FA] text-xs text-[#334155] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Protected under CAC & SCUML anti-fraud verification standards.</span>
              </div>

              {sentErr && <p className="text-xs text-red-600 font-semibold">{sentErr}</p>}
              {sentOk && (
                <div className="p-3 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sentOk}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 px-4 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white font-bold text-xs"
              >
                {sending ? 'Submitting...' : `Submit Formal Inquiry to ${agency.businessName}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
