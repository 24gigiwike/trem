import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Megaphone, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PropertyListing } from '../../shared/types';
import { formatMoney } from '../../shared/commercial';
import {
  bulkUpdateVendorPropertiesLocal,
  deleteVendorPropertyLocal,
  getVendorPropertiesLocal,
} from '../../lib/localStore';
import { PortalShell } from '../../components/PortalShell';
import { SafeImage } from '../../components/SafeImage';

export function VendorPropertiesPage() {
  const { vendorProfile } = useApp();
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMsg, setActionMsg] = useState('');

  const loadProperties = () => {
    if (!vendorProfile) return;
    setProperties(getVendorPropertiesLocal(vendorProfile.id));
    setLoading(false);
  };

  useEffect(() => {
    loadProperties();
  }, [vendorProfile]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkAction = (action: 'mark_sold' | 'move_to_draft') => {
    if (!vendorProfile || selectedIds.length === 0) return;
    bulkUpdateVendorPropertiesLocal(vendorProfile.id, selectedIds, action);
    setActionMsg(`Updated ${selectedIds.length} listing(s).`);
    setSelectedIds([]);
    loadProperties();
  };

  const handleDelete = (id: string) => {
    if (!vendorProfile) return;
    deleteVendorPropertyLocal(vendorProfile.id, id);
    setActionMsg('Listing removed.');
    loadProperties();
  };

  const exportCsv = () => {
    const rows = [
      ['RefCode', 'Title', 'Category', 'State', 'PriceNGN', 'Status', 'Views'],
      ...properties.map((p) => [p.refCode, `"${p.title.replace(/"/g, '""')}"`, p.category, p.state, p.priceNgn, p.status, p.viewsCount]),
    ];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trem-inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = properties.filter((p) => {
    if (statusTab !== 'all' && p.status !== statusTab) return false;
    if (catFilter !== 'all' && p.category !== catFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return p.title.toLowerCase().includes(q) || p.refCode.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    }
    return true;
  });

  const published = properties.filter((p) => p.status === 'published');
  const pending = properties.filter((p) => p.status === 'pending_review');
  const drafts = properties.filter((p) => p.status === 'draft');
  const sold = properties.filter((p) => p.status === 'sold');

  return (
    <PortalShell title="My Properties">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Inventory Management</span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48]">
              My Properties <span className="text-base font-bold text-[#5A6782]">({properties.length} Total)</span>
            </h1>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white border border-[#DCE3F0] text-xs font-bold text-[#0B1B48] hover:bg-[#F4F6FA]"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/vendor/add"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Property</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg border border-[#DCE3F0] p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: `All Listings (${properties.length})` },
              { key: 'published', label: `Published (${published.length})` },
              { key: 'pending_review', label: `Pending Review (${pending.length})` },
              { key: 'draft', label: `Drafts (${drafts.length})` },
              { key: 'sold', label: `Sold (${sold.length})` },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  statusTab === t.key ? 'bg-[#0B1B48] text-white' : 'bg-[#F4F6FA] text-[#5A6782] hover:text-[#0B1B48]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#5A6782] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, ref code, or address..."
                className="w-full pl-9 pr-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs"
              />
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs font-semibold"
            >
              <option value="all">All Asset Classes</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land_banking">Land Banking</option>
              <option value="buy_build">Buy & Build</option>
            </select>
          </div>
        </div>

        {/* Bulk Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-[#0B1B48] text-white rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold">{selectedIds.length} properties selected</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleBulkAction('mark_sold')}
                className="px-3 py-1.5 rounded-md bg-[#E8C547] text-[#0B1B48] font-bold"
              >
                Mark as Sold
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('move_to_draft')}
                className="px-3 py-1.5 rounded-md bg-white/15 text-white font-bold"
              >
                Move to Draft
              </button>
            </div>
          </div>
        )}

        {actionMsg && <div className="p-3 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-bold">{actionMsg}</div>}

        {/* Inventory List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#DCE3F0] p-12 text-center space-y-3">
            <h3 className="font-display font-bold text-lg text-[#0B1B48]">No Properties in This View</h3>
            <p className="text-xs text-[#5A6782]">Create a new property listing using the 9-step Property Wizard.</p>
            <Link to="/vendor/add" className="inline-block px-5 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
              + Add Property
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-lg border border-[#DCE3F0] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(prop.id)}
                    onChange={() => toggleSelect(prop.id)}
                    className="mt-2 accent-[#0B1B48]"
                  />
                  <SafeImage src={prop.images[0]} alt={prop.title} className="w-24 h-20 rounded-md object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase">
                      <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688]">{prop.category.replace('_', ' ')}</span>
                      <span className="font-mono text-[#5A6782]">REF: {prop.refCode}</span>
                      <span
                        className={`px-2 py-0.5 rounded ${
                          prop.status === 'published'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : prop.status === 'pending_review'
                            ? 'bg-[#FEF9C3] text-[#0B1B48]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prop.status.replace('_', ' ')}
                      </span>
                      {prop.isPromoted && (
                        <span className="px-2 py-0.5 rounded bg-[#E8C547] text-[#0B1B48]">Promoted</span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-[#0B1B48] truncate mt-1">{prop.title}</h3>
                    <p className="text-xs text-[#5A6782] truncate">{prop.address}</p>
                    {prop.moderationNote && (
                      <p className="text-[11px] text-amber-700 mt-1">Moderation Note: {prop.moderationNote}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-5 shrink-0">
                  <div className="text-left lg:text-right">
                    <div className="font-display font-extrabold text-base text-[#0B1B48] tabular-nums">
                      {formatMoney(prop.priceNgn)}
                    </div>
                    <div className="text-[11px] text-[#5A6782] tabular-nums">
                      {prop.viewsCount.toLocaleString()} views · {prop.inquiriesCount || 0} inquiries
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/vendor/add?edit=${prop.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#EEF2FA] hover:bg-[#DCE3F0] text-[#0B1B48] text-xs font-bold"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </Link>
                    {prop.status === 'published' && (
                      <Link
                        to={`/vendor/promote?propertyId=${prop.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Boost</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(prop.id)}
                      title="Delete Listing"
                      className="p-2 rounded-md border border-[#DCE3F0] text-[#5A6782] hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
