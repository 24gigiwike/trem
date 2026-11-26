import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Lock, Megaphone, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PromotionRecord, PropertyListing } from '../../shared/types';
import { calculatePromotionQuote, PROMOTION_PACKAGES } from '../../shared/commercial';
import { PortalShell } from '../../components/PortalShell';
import { SafeImage } from '../../components/SafeImage';

export function VendorPromotionPage() {
  const { apiFetch } = useApp();
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionRecord[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(searchParams.get('propertyId') || '');
  const [packageCode, setPackageCode] = useState<'promo_1w' | 'promo_2w' | 'promo_1m'>('promo_2w');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  const loadData = () => {
    Promise.all([
      apiFetch<{ properties: PropertyListing[] }>('/api/vendor/properties'),
      apiFetch<{ promotions: PromotionRecord[] }>('/api/billing/overview'),
    ])
      .then(([pRes, bRes]) => {
        const eligible = pRes.properties.filter((p) => p.status === 'published');
        setProperties(eligible);
        if (!selectedPropertyId && eligible[0]) {
          setSelectedPropertyId(eligible[0].id);
        }
        setCampaigns(bRes.promotions);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const quote = calculatePromotionQuote(packageCode);

  const handleLaunchPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) {
      setError('Select a published property to promote.');
      return;
    }
    setProcessing(true);
    setError('');
    setStatusMsg('');
    try {
      const orderRes = await apiFetch<{ order: { reference: string } }>('/api/billing/orders', {
        method: 'POST',
        body: JSON.stringify({
          orderType: 'promotion',
          propertyId: selectedProperty.id,
          packageCode,
          paymentMethod,
          idempotencyKey: `promo_${selectedProperty.id}_${packageCode}_${Date.now()}`,
        }),
      });
      await apiFetch(`/api/billing/sandbox-confirm/${orderRes.order.reference}`, { method: 'POST' });
      setStatusMsg(`Promotion activated (${orderRes.order.reference}). ${selectedProperty.refCode} is now boosted.`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate promotion.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PortalShell title="Promote Listings">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Vendor Workspace / Promotion Checkout</span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48]">
              Boost Property Visibility Across Nigeria
            </h1>
          </div>
          <div className="px-4 py-2 rounded-md bg-[#EEF2FA] text-xs font-bold text-[#0B1B48]">
            Average Lift: <span className="text-[#16A34A]">+340% Qualified Views</span>
          </div>
        </div>

        {/* Property Selector */}
        <div className="bg-white rounded-lg border border-[#DCE3F0] p-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6782] mb-2">
            Select Published Property to Promote
          </label>
          {properties.length === 0 ? (
            <p className="text-xs text-[#5A6782]">No published properties available yet. Publish a property first to promote it.</p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {selectedProperty && (
                  <SafeImage src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-16 h-14 rounded-md object-cover shrink-0" />
                )}
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm font-semibold text-[#0B1B48] w-full sm:w-96"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.refCode} — {p.title}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProperty && (
                <div className="text-sm font-display font-extrabold text-[#0B1B48] tabular-nums shrink-0">
                  ₦{selectedProperty.priceNgn.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Promotion Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['promo_1w', 'promo_2w', 'promo_1m'] as const).map((code) => {
            const pkg = PROMOTION_PACKAGES[code];
            const selected = packageCode === code;
            return (
              <div
                key={code}
                onClick={() => setPackageCode(code)}
                className={`cursor-pointer rounded-lg p-6 flex flex-col justify-between transition-all ${
                  selected ? 'bg-white border-2 border-[#0B1B48] shadow-sm' : 'bg-white border border-[#DCE3F0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] text-[10px] font-bold uppercase">
                      {pkg.tierLabel}
                    </span>
                    {pkg.popular && (
                      <span className="px-2 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-[10px] font-bold uppercase">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-extrabold text-xl text-[#0B1B48] mt-3">{pkg.name}</h2>
                  <p className="text-xs text-[#5A6782]">{pkg.durationLabel}</p>
                  <div className="mt-4 font-display font-extrabold text-3xl text-[#0B1B48] tabular-nums">
                    ₦{pkg.priceNgn.toLocaleString()}
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-[#334155]">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#1B3688] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`mt-6 text-center py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 ${
                    selected ? 'bg-[#E8C547] text-[#0B1B48]' : 'bg-[#EEF2FA] text-[#0B1B48]'
                  }`}
                >
                  {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{selected ? 'Selected Plan' : `Choose ${pkg.name}`}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment & Order Summary */}
        <form onSubmit={handleLaunchPromotion} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#0B1B48]">Payment & Activation Method</h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
                <Lock className="w-3.5 h-3.5" />
                <span>Sandbox Webhook Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'card', label: 'Debit / Credit Cards' },
                { key: 'bank_transfer', label: 'Nigerian Bank Transfer' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key as typeof paymentMethod)}
                  className={`py-2.5 px-3 rounded-md text-xs font-bold border ${
                    paymentMethod === m.key ? 'bg-[#0B1B48] text-white border-[#0B1B48]' : 'bg-[#F4F6FA] text-[#334155] border-[#DCE3F0]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-[#5A6782]">
              Promotion entitlement activates in Nigerian Naira (₦) strictly after server-side webhook signature confirmation.
            </p>
          </div>

          <div className="lg:col-span-5 bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0B1B48]">Order Summary</h3>
            <div className="p-3.5 rounded-md bg-[#EEF2FA] flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-[#0B1B48]">{quote.pkg.name}</div>
                <div className="text-[#5A6782]">{quote.pkg.durationLabel}</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-white font-bold text-[#1B3688]">{quote.pkg.durationDays} Days</span>
            </div>

            <div className="space-y-2 text-xs border-b border-[#DCE3F0] pb-3">
              <div className="flex justify-between">
                <span className="text-[#5A6782]">Base Promotion Fee</span>
                <span className="font-bold tabular-nums">₦{quote.netNgn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6782]">7.5% Federal VAT</span>
                <span className="font-bold tabular-nums">₦{quote.vatNgn.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase text-[#5A6782]">Total Payable Now</div>
              <div className="font-display font-extrabold text-3xl text-[#0B1B48] tabular-nums">₦{quote.totalNgn.toLocaleString()}</div>
            </div>

            {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            {statusMsg && (
              <div className="p-3 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={processing || !selectedProperty}
              className="w-full py-3 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4" />
              <span>{processing ? 'Launching...' : `Pay ₦${quote.totalNgn.toLocaleString()} & Launch Promotion`}</span>
            </button>
          </div>
        </form>

        {/* Campaign Logs Table */}
        <div className="bg-white rounded-lg border border-[#DCE3F0] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#DCE3F0]">
            <h3 className="font-display font-bold text-base text-[#0B1B48]">Campaign Performance & Logs</h3>
          </div>
          {campaigns.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5A6782]">No promotion campaigns yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#DCE3F0] text-[#5A6782] uppercase">
                  <tr>
                    <th className="py-3 px-4">Property & Ref</th>
                    <th className="py-3 px-4">Package</th>
                    <th className="py-3 px-4">Expires</th>
                    <th className="py-3 px-4 text-right">Views</th>
                    <th className="py-3 px-4 text-right">Leads</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3F0]">
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-semibold text-[#0B1B48]">
                        {c.propertyRef} — {c.propertyTitle}
                      </td>
                      <td className="py-3 px-4">{PROMOTION_PACKAGES[c.packageCode]?.name || c.packageCode}</td>
                      <td className="py-3 px-4 tabular-nums text-[#5A6782]">{new Date(c.expiresAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums">{c.viewsGenerated.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums">{c.leadsGenerated}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] font-bold uppercase text-[10px]">
                          {c.status}
                        </span>
                      </td>
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
