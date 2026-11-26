import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CheckCircle2, Search, ShieldCheck, MessageSquare, Video, FileCheck2, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PropertyListing } from '../../shared/types';
import { formatMoney, SUBSCRIPTION_PLANS } from '../../shared/commercial';
import { queryLocalProperties } from '../../lib/localStore';
import { PropertyCard } from '../../components/PropertyCard';
import { SafeImage } from '../../components/SafeImage';

export function HomePage() {
  const { apiFetch } = useApp();
  const navigate = useNavigate();

  const initialData = queryLocalProperties({ limit: 4, sort: 'featured' });
  const [featured, setFeatured] = useState<PropertyListing[]>(initialData.items);
  const [counts, setCounts] = useState<Record<string, number>>(initialData.categoryCounts);
  const [loading, setLoading] = useState(false);

  const [purpose, setPurpose] = useState('buy');
  const [locationQuery, setLocationQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [titleDoc, setTitleDoc] = useState('all');

  useEffect(() => {
    const local = queryLocalProperties({ limit: 4, sort: 'featured' });
    setFeatured(local.items);
    setCounts(local.categoryCounts);

    apiFetch<{ items: PropertyListing[]; categoryCounts: Record<string, number> }>('/api/public/properties?limit=4&sort=featured')
      .then((res) => {
        if (res.items && res.items.length > 0 && local.items.length <= 6) {
          setFeatured(local.items.length > 0 ? local.items : res.items);
        }
        if (res.categoryCounts) {
          setCounts((prev) => ({
            residential: Math.max(prev.residential || 0, res.categoryCounts.residential || 0),
            commercial: Math.max(prev.commercial || 0, res.categoryCounts.commercial || 0),
            land_banking: Math.max(prev.land_banking || 0, res.categoryCounts.land_banking || 0),
            buy_build: Math.max(prev.buy_build || 0, res.categoryCounts.buy_build || 0),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (locationQuery.trim()) params.set('q', locationQuery.trim());
    if (category !== 'all') params.set('category', category);
    if (purpose !== 'all') params.set('purpose', purpose);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (titleDoc !== 'all') params.set('titleDoc', titleDoc);
    navigate(`/explore?${params.toString()}`);
  };

  const heroDrop = featured[0];

  const categories = [
    {
      key: 'residential',
      title: 'Residential Buildings',
      desc: 'Detached duplexes, serviced terraces, luxury penthouses, and turnkey smart homes.',
      priceFrom: 'From ₦35,000,000',
      image: '/src/assets/images/prop_lekki_villa_1795687716839.jpg',
      count: counts.residential ?? 0,
    },
    {
      key: 'commercial',
      title: 'Commercial Buildings',
      desc: 'Multi-level shopping plazas, corporate office towers, logistics hubs, and warehouses.',
      priceFrom: 'From ₦150,000,000',
      image: '/src/assets/images/prop_vi_plaza_1795687717957.jpg',
      count: counts.commercial ?? 0,
    },
    {
      key: 'land_banking',
      title: 'Land Banking',
      desc: 'Long-term strategic land assets positioned along developing industrial growth corridors.',
      priceFrom: 'From ₦4,500,000 / Plot',
      image: '/src/assets/images/prop_epe_landbank_1795687718861.jpg',
      count: counts.land_banking ?? 0,
    },
    {
      key: 'buy_build',
      title: 'Buy & Build',
      desc: '100% dry serviced plots with instant physical allocation, perimeter fencing, and power grids.',
      priceFrom: 'From ₦12,000,000',
      image: '/src/assets/images/prop_owerri_buybuild_1795687718799.jpg',
      count: counts.buy_build ?? 0,
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#071336] text-white border-b border-white/10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-10 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 border-l-2 border-[#E8C547] pl-3 text-[11px] font-bold uppercase tracking-wider text-[#E8C547]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>CAC & SCUML Accredited Nigerian Property Portal</span>
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-[1.08] tracking-tight text-balance">
                The Real Estate <span className="text-[#E8C547]">Marketplace</span>
              </h1>
              <p className="text-base sm:text-lg font-medium text-slate-200 max-w-2xl">
                Verified residential, commercial, land banking, and buy-and-build properties across Nigeria.
              </p>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                TREM connects serious property seekers and corporate buyers directly with vetted real estate agencies, licensed developers, and verified individual title holders.
              </p>

              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/15 max-w-lg">
                <div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-white tabular-nums">₦52B+</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mt-0.5">Verified Inventory</div>
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#E8C547] tabular-nums">99.4%</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mt-0.5">Title Authenticity</div>
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl sm:text-3xl text-white tabular-nums">36 States</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mt-0.5">& FCT Abuja</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              {heroDrop ? (
                <Link
                  to={`/properties/${heroDrop.refCode}`}
                  className="block rounded-lg overflow-hidden border border-white/15 bg-[#0B1B48] group"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <SafeImage
                      src={heroDrop.images[0]}
                      alt={heroDrop.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#E8C547] text-[#0B1B48] text-[10px] font-bold uppercase tracking-wider">
                      Featured Asset
                    </span>
                  </div>
                  <div className="p-4 flex items-end justify-between gap-3 border-t border-white/15">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E8C547]">{heroDrop.refCode}</span>
                      <h2 className="font-display font-bold text-base text-white truncate mt-0.5">{heroDrop.title}</h2>
                      <p className="text-xs text-slate-300 truncate">{heroDrop.corridor || heroDrop.city}, {heroDrop.state} · {heroDrop.titleDocType}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-extrabold text-lg text-[#E8C547] tabular-nums">
                        {formatMoney(heroDrop.priceNgn)}
                      </div>
                      <div className="text-[11px] text-slate-300">Direct Vendor Price</div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-lg bg-white/5 border border-white/15 aspect-[16/11] animate-pulse" />
              )}
            </div>
          </div>

          {/* Unified Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 bg-white rounded-lg p-4 sm:p-5 text-[#0B1B48] border border-[#DCE3F0]">
            <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[#DCE3F0]">
              {[
                { key: 'buy', label: 'Buy Outright' },
                { key: 'rent', label: 'Rent & Lease' },
                { key: 'land_banking', label: 'Land Banking' },
                { key: 'buy_build', label: 'Buy & Build' },
                { key: 'jv', label: 'Joint Venture (JV)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPurpose(tab.key)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                    purpose === tab.key ? 'bg-[#0B1B48] text-white' : 'bg-[#F4F6FA] text-[#5A6782] hover:text-[#0B1B48]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6782] mb-1">Location / City</label>
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="e.g. Lekki, Maitama, Owerri"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm focus:outline-none focus:border-[#0B1B48]"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6782] mb-1">Property Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm focus:outline-none focus:border-[#0B1B48]"
                >
                  <option value="all">All Categories</option>
                  <option value="residential">Residential Buildings</option>
                  <option value="commercial">Commercial Plazas</option>
                  <option value="land_banking">Land Banking</option>
                  <option value="buy_build">Buy & Build Plots</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6782] mb-1">Budget Ceiling</label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm focus:outline-none focus:border-[#0B1B48]"
                >
                  <option value="">Any Budget</option>
                  <option value="50000000">Up to ₦50M</option>
                  <option value="250000000">Up to ₦250M</option>
                  <option value="500000000">Up to ₦500M</option>
                  <option value="1500000000">Up to ₦1.5B</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A6782] mb-1">Title Document</label>
                <select
                  value={titleDoc}
                  onChange={(e) => setTitleDoc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm focus:outline-none focus:border-[#0B1B48]"
                >
                  <option value="all">All Verified Titles</option>
                  <option value="Certificate of Occupancy">Certificate of Occupancy (C of O)</option>
                  <option value="Governor">Governor&apos;s Consent</option>
                  <option value="Gazette">Government Gazette</option>
                </select>
              </div>

              <div className="lg:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] font-bold text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span className="lg:hidden">Search</span>
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#DCE3F0] flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6782]">Quick Filters:</span>
              {[
                { label: 'Certificate of Occupancy', url: '/explore?titleDoc=Certificate+of+Occupancy' },
                { label: 'Lekki Phase 1', url: '/explore?q=Lekki' },
                { label: 'Maitama Abuja', url: '/explore?q=Maitama' },
                { label: 'Victoria Island Commercial', url: '/explore?q=Victoria+Island&category=commercial' },
              ].map((chip) => (
                <Link
                  key={chip.label}
                  to={chip.url}
                  className="px-2.5 py-1 rounded bg-[#F4F6FA] hover:bg-[#EEF2FA] text-[#1B3688] font-medium border border-[#DCE3F0]"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* Asset Classifications */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Asset Classifications</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-1">
              Explore Verified Properties by Purpose
            </h2>
            <p className="text-sm text-[#5A6782] mt-1">
              Find authenticated assets tailored to your residential, commercial, or land acquisition requirements.
            </p>
          </div>
          <Link to="/explore" className="inline-flex items-center gap-1 text-xs font-bold text-[#1B3688] hover:underline whitespace-nowrap">
            <span>View All Classifications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              to={`/explore?category=${cat.key}`}
              className="group bg-white rounded-lg border border-[#DCE3F0] overflow-hidden flex flex-col hover:border-[#0B1B48] transition-colors"
            >
              <div className="relative aspect-[16/10] bg-[#0B1B48] overflow-hidden">
                <SafeImage
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#0B1B48] text-white text-[10px] font-bold uppercase tracking-wider tabular-nums">
                  {cat.count} Live Assets
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#0B1B48]">{cat.title}</h3>
                  <p className="text-xs text-[#5A6782] mt-1.5 leading-relaxed">{cat.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#DCE3F0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B1B48] tabular-nums">{cat.priceFrom}</span>
                  <span className="w-7 h-7 rounded-md bg-[#0B1B48] text-white flex items-center justify-center group-hover:bg-[#E8C547] group-hover:text-[#0B1B48] transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <span>Browse All Verified Listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Curated & Promoted Assets */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Featured Portfolio</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-1">
              Curated & Promoted Real Estate Assets
            </h2>
            <p className="text-sm text-[#5A6782] mt-1">
              Authenticated titles, survey records, and verified vendor identities across Nigeria.
            </p>
          </div>
          <Link
            to="/vendor/promote"
            className="px-4 py-2 rounded-md bg-[#0B1B48] text-white text-xs font-bold hover:bg-[#1B3688] transition-colors whitespace-nowrap"
          >
            Promote Your Listings
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {/* Marketplace Verification Pillars */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-16">
        <div className="border-t border-[#DCE3F0] pt-12">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Marketplace Standards</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-1">
              Why Nigerian Property Seekers and Agencies Trust TREM
            </h2>
            <p className="text-sm text-[#5A6782] mt-2">
              Structured vetting, title documentation checks, and direct seller accountability eliminate avoidable risk in Nigerian property transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: '1. Rigorous Agency & Title Vetting',
                body: 'Every agency and vendor undergoes CAC corporate checks, SCUML compliance review, and title deed verification.',
                tag: 'Zero Unvetted Listings',
              },
              {
                icon: MessageSquare,
                title: '2. Direct Vendor Access',
                body: 'Connect directly via verified broker phone lines, WhatsApp, and formal inquiry routing with authorized sellers.',
                tag: 'Direct Accountability',
              },
              {
                icon: Video,
                title: '3. Scheduled Live Inspections',
                body: 'Book physical site visits or live video walkthroughs with independent survey beacon coordinates.',
                tag: 'Verified Site Access',
              },
              {
                icon: FileCheck2,
                title: '4. Registry Title Clarity',
                body: 'Every property specifies C of O, Governor’s Consent, or Gazette status alongside cadastral survey file references.',
                tag: 'Transparent Documentation',
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="bg-white rounded-lg border border-[#DCE3F0] p-5 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-md bg-[#EEF2FA] text-[#1B3688] flex items-center justify-center mb-4">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-display font-bold text-base text-[#0B1B48]">{pillar.title}</h3>
                    <p className="text-xs text-[#5A6782] mt-2 leading-relaxed">{pillar.body}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#DCE3F0] text-[11px] font-bold text-[#16A34A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{pillar.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enlist Properties CTA */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-16">
        <div className="bg-[#0B1B48] text-white rounded-lg p-6 sm:p-10 border border-[#1B3688]">
          <div className="max-w-2xl mb-8">
            <span className="inline-block border-l-2 border-[#E8C547] pl-2.5 text-[#E8C547] text-[11px] font-bold uppercase tracking-wider">
              Vendor & Agency Membership
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl mt-2">Enlist Your Properties on TREM</h2>
            <p className="text-sm text-slate-300 mt-2">
              Join certified real estate agencies, commercial developers, and independent property owners showcasing verified inventory to qualified buyers across Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white text-[#0B1B48] rounded-lg p-6 flex flex-col justify-between border border-[#DCE3F0]">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-lg">{SUBSCRIPTION_PLANS.standard.name}</h3>
                  <span className="px-2.5 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] text-xs font-bold">Up to 5 Listings</span>
                </div>
                <p className="text-xs text-[#5A6782] mt-1">{SUBSCRIPTION_PLANS.standard.tagline}</p>
                <div className="mt-4 font-display font-extrabold text-3xl tabular-nums">
                  ₦{SUBSCRIPTION_PLANS.standard.monthlyPriceNgn.toLocaleString()}
                  <span className="text-xs font-normal text-[#5A6782]"> / month</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-[#334155] border-t border-[#DCE3F0] pt-4">
                  {SUBSCRIPTION_PLANS.standard.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/auth?role=vendor"
                className="mt-6 block text-center py-2.5 px-4 rounded-md bg-[#EEF2FA] hover:bg-[#DCE3F0] text-[#0B1B48] text-xs font-bold transition-colors"
              >
                Enlist as Independent Vendor
              </Link>
            </div>

            <div className="bg-[#071336] text-white rounded-lg p-6 flex flex-col justify-between border-2 border-[#E8C547]">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-lg">{SUBSCRIPTION_PLANS.premium.name}</h3>
                  <span className="px-2.5 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-xs font-bold">Unlimited Listings</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{SUBSCRIPTION_PLANS.premium.tagline}</p>
                <div className="mt-4 font-display font-extrabold text-3xl text-[#E8C547] tabular-nums">
                  ₦{SUBSCRIPTION_PLANS.premium.monthlyPriceNgn.toLocaleString()}
                  <span className="text-xs font-normal text-slate-300"> / month</span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-slate-200 border-t border-white/15 pt-4">
                  {SUBSCRIPTION_PLANS.premium.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#E8C547] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/auth?role=agency"
                className="mt-6 block text-center py-2.5 px-4 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold transition-colors"
              >
                Get Started as Certified Agency
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Client & Agency Reviews */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48]">Verified Client & Agency Reviews</h2>
            <p className="text-sm text-[#5A6782] mt-1">
              Feedback from property buyers, corporate investors, and accredited partner agencies on TREM.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#0B1B48]">
            <Star className="w-4 h-4 fill-[#E8C547] text-[#E8C547]" />
            <span className="tabular-nums">4.9 / 5</span>
            <span className="text-xs font-normal text-[#5A6782]">(1,400+ Verified Reviews)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              initials: 'TO',
              name: 'Dr. Tunde Oladipo',
              role: 'Residential Buyer · Maitama, Abuja',
              quote:
                'Verifying title records before committing to a purchase in Abuja used to require weeks of back-and-forth. TREM provided the survey reference and direct broker access upfront.',
            },
            {
              initials: 'CN',
              name: 'Chinedu Nwosu',
              role: 'Commercial Acquisition Lead · Victoria Island, Lagos',
              quote:
                'TREM gave our investment team clear visibility into vetted commercial and land banking opportunities along the Lekki-Epe corridor with direct agency documentation.',
            },
            {
              initials: 'EO',
              name: 'Chief Emeka Obi',
              role: 'Managing Partner · Owerri Heritage Realtors',
              quote:
                'As a certified developer in New Owerri, our sales cycle shortened noticeably after upgrading to TREM Premium. Enquiries arrive pre-qualified from serious buyers.',
            },
          ].map((t) => (
            <div key={t.name} className="bg-white rounded-lg border border-[#DCE3F0] p-5 flex flex-col justify-between">
              <p className="text-xs text-[#334155] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-3 border-t border-[#DCE3F0] flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#0B1B48] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                  {t.initials}
                </div>
                <div>
                  <div className="font-display font-bold text-xs text-[#0B1B48]">{t.name}</div>
                  <div className="text-[11px] text-[#5A6782]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
