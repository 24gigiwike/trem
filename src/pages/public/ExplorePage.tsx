import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, LayoutGrid, List, Search, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PropertyListing } from '../../shared/types';
import { queryLocalProperties } from '../../lib/localStore';
import { PropertyCard } from '../../components/PropertyCard';

export function ExplorePage() {
  const { apiFetch } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<PropertyListing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const purpose = searchParams.get('purpose') || 'all';
  const titleDoc = searchParams.get('titleDoc') || 'all';
  const beds = searchParams.get('beds') || '0';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const sort = searchParams.get('sort') || 'featured';
  const page = Number(searchParams.get('page') || 1);

  const [draftQuery, setDraftQuery] = useState(q);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === '0' || value === 'false') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const resetFilters = () => {
    setDraftQuery('');
    setSearchParams(new URLSearchParams());
  };

  const fetchCatalogue = useCallback(async () => {
    const localRes = queryLocalProperties({
      q,
      category,
      purpose,
      titleDoc,
      beds: Number(beds || 0),
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      verifiedOnly,
      sort,
      page,
      limit: 12,
    });
    setItems(localRes.items);
    setTotal(localRes.total);
    setTotalPages(localRes.totalPages);
    setCounts(localRes.categoryCounts);
    setLoading(false);

    try {
      const qs = searchParams.toString();
      const res = await apiFetch<{
        items: PropertyListing[];
        total: number;
        totalPages: number;
        categoryCounts: Record<string, number>;
      }>(`/api/public/properties?${qs}`);
      if (res.items && res.items.length > localRes.items.length) {
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setCounts(res.categoryCounts || localRes.categoryCounts);
      }
    } catch {
      // Local catalogue already rendered seamlessly
    }
  }, [apiFetch, searchParams, q, category, purpose, titleDoc, beds, minPrice, maxPrice, verifiedOnly, sort, page]);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', draftQuery.trim());
  };

  const FilterPanel = (
    <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#DCE3F0]">
        <span className="font-display font-bold text-sm text-[#0B1B48] flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-[#1B3688]" />
          <span>Filter Assets</span>
        </span>
        <button type="button" onClick={resetFilters} className="text-xs font-semibold text-[#1B3688] hover:underline">
          Reset All
        </button>
      </div>

      <label className="flex items-center justify-between gap-3 p-3 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] cursor-pointer">
        <div>
          <span className="block text-xs font-bold text-[#0B1B48]">Verified Vendors Only</span>
          <span className="block text-[11px] text-[#5A6782]">CAC & survey vetted title</span>
        </div>
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => updateParam('verifiedOnly', String(e.target.checked))}
          className="w-4 h-4 accent-[#0B1B48]"
        />
      </label>

      <div>
        <span className="block text-xs font-bold text-[#0B1B48] mb-2">Price Range (₦)</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min ₦"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            className="w-full px-2.5 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs tabular-nums"
          />
          <input
            type="number"
            placeholder="Max ₦"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full px-2.5 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs tabular-nums"
          />
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-[#0B1B48] mb-2">Property Category</span>
        <div className="space-y-2 text-xs">
          {[
            { key: 'all', label: 'All Categories', count: totalAll },
            { key: 'residential', label: 'Residential (Duplex & Flats)', count: counts.residential || 0 },
            { key: 'commercial', label: 'Commercial (Offices, Plazas)', count: counts.commercial || 0 },
            { key: 'land_banking', label: 'Land Banking (Acres & Plots)', count: counts.land_banking || 0 },
            { key: 'buy_build', label: 'Buy & Build Serviced Land', count: counts.buy_build || 0 },
          ].map((c) => (
            <label key={c.key} className="flex items-center justify-between gap-2 cursor-pointer">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="filter-cat"
                  checked={category === c.key}
                  onChange={() => updateParam('category', c.key)}
                  className="accent-[#0B1B48]"
                />
                <span className="text-[#334155]">{c.label}</span>
              </span>
              <span className="text-[#5A6782] tabular-nums">{c.count}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-[#0B1B48] mb-2">Bedrooms</span>
        <div className="grid grid-cols-6 gap-1">
          {['0', '1', '2', '3', '4', '5'].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => updateParam('beds', b)}
              className={`py-1.5 rounded-md text-xs font-bold border transition-colors ${
                beds === b ? 'bg-[#0B1B48] text-white border-[#0B1B48]' : 'bg-[#F4F6FA] text-[#334155] border-[#DCE3F0]'
              }`}
            >
              {b === '0' ? 'Any' : `${b}+`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-[#0B1B48] mb-2">Documentation & Title</span>
        <select
          value={titleDoc}
          onChange={(e) => updateParam('titleDoc', e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs"
        >
          <option value="all">Any Verified Title</option>
          <option value="Certificate of Occupancy">Certificate of Occupancy (C of O)</option>
          <option value="Governor">Governor&apos;s Consent</option>
          <option value="Gazette">Government Gazette / Excision</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Verified Nigerian Property Directory</span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-1">Explore Properties</h1>
            <p className="text-xs sm:text-sm text-[#5A6782] mt-1">
              Browse verified residential, commercial, land banking, and buy-and-build assets from accredited agencies and vendors.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#F4F6FA] p-1 rounded-md border border-[#DCE3F0] self-start">
            {[
              { key: 'all', label: 'All Modes' },
              { key: 'buy', label: 'Buy Asset' },
              { key: 'rent', label: 'Rent' },
              { key: 'lease', label: 'Lease Hold' },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => updateParam('purpose', m.key)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap ${
                  purpose === m.key ? 'bg-[#0B1B48] text-white' : 'text-[#5A6782] hover:text-[#0B1B48]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5">
          {[
            { key: 'all', label: `All Properties (${totalAll})` },
            { key: 'residential', label: `Residential (${counts.residential || 0})` },
            { key: 'commercial', label: `Commercial (${counts.commercial || 0})` },
            { key: 'land_banking', label: `Land Banking (${counts.land_banking || 0})` },
            { key: 'buy_build', label: `Buy & Build (${counts.buy_build || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => updateParam('category', tab.key)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold border transition-colors whitespace-nowrap ${
                category === tab.key
                  ? 'bg-[#0B1B48] text-white border-[#0B1B48]'
                  : 'bg-[#F4F6FA] text-[#334155] border-[#DCE3F0] hover:border-[#0B1B48]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#5A6782] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              placeholder="Search location, corridor, title, or Ref ID (e.g. Lekki, TRM-LOS-7842)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm focus:outline-none focus:border-[#0B1B48]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] font-bold text-xs uppercase tracking-wider whitespace-nowrap"
          >
            Search Assets
          </button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden px-4 py-2.5 rounded-md bg-[#0B1B48] text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-display font-bold text-[#0B1B48] tabular-nums">{total} Verified Property Listings</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SCUML Certified</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="px-3 py-1.5 rounded-md bg-white border border-[#DCE3F0] text-xs font-semibold text-[#0B1B48]"
          >
            <option value="featured">Sort: Featured & Promoted First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest Enlistments</option>
          </select>

          <div className="hidden sm:flex items-center bg-white border border-[#DCE3F0] rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#0B1B48] text-white' : 'text-[#5A6782]'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#0B1B48] text-white' : 'text-[#5A6782]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 sticky top-20">{FilterPanel}</aside>

        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-96 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#DCE3F0] p-12 text-center">
              <h3 className="font-display font-bold text-lg text-[#0B1B48]">No matching verified assets found</h3>
              <p className="text-sm text-[#5A6782] mt-1">
                Try broadening your price ceiling, bedroom filter, or location query.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-5 py-2 rounded-md bg-[#0B1B48] text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
              {items.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateParam('page', String(p))}
                  className={`w-9 h-9 rounded-md text-xs font-bold tabular-nums border ${
                    page === p ? 'bg-[#0B1B48] text-white border-[#0B1B48]' : 'bg-white text-[#0B1B48] border-[#DCE3F0]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="mt-12 bg-[#0B1B48] text-white rounded-lg p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#1B3688]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8C547]">Agency & Developer Program</span>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl mt-1">
                Are you a Property Owner, Developer, or Licensed Realtor?
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-xl">
                Enlist your residential, commercial, or land assets directly on TREM and connect with verified buyers and corporate investors across Nigeria.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to="/auth?role=agency" className="px-5 py-2.5 rounded-md bg-[#E8C547] text-[#0B1B48] text-xs font-bold whitespace-nowrap">
                Enlist Property Now
              </Link>
              <Link to="/pricing" className="px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold whitespace-nowrap">
                Compare Vendor Tiers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end lg:hidden">
          <div className="w-full max-w-sm bg-[#F4F6FA] h-full overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-bold text-base">Filter Properties</span>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-md bg-white border border-[#DCE3F0]">
                <X className="w-4 h-4" />
              </button>
            </div>
            {FilterPanel}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-4 w-full py-3 rounded-md bg-[#0B1B48] text-white text-xs font-bold"
            >
              Show {total} Properties
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
