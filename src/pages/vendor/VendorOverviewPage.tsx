import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Eye, Megaphone, MessageSquare, PlusCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EnquiryRecord, PropertyListing, SubscriptionRecord, VendorProfile } from '../../shared/types';
import { formatMoney, PROMOTION_PACKAGES } from '../../shared/commercial';
import { PortalShell } from '../../components/PortalShell';
import { SafeImage } from '../../components/SafeImage';

interface VendorOverviewData {
  vendor: VendorProfile & { verification_status?: string; business_name?: string; rc_number?: string };
  subscription: SubscriptionRecord | null;
  stats: {
    totalInventory: number;
    publishedCount: number;
    pendingCount: number;
    draftCount: number;
    totalPortfolioNgn: number;
    totalViews: number;
    totalLeads: number;
    promotedCount: number;
  };
  attentionProperties: PropertyListing[];
  topProperties: PropertyListing[];
  recentLeads: EnquiryRecord[];
}

export function VendorOverviewPage() {
  const { apiFetch, vendorProfile } = useApp();
  const [data, setData] = useState<VendorOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = () => {
    setLoading(true);
    apiFetch<VendorOverviewData>('/api/vendor/overview')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const markLeadResponded = async (leadId: string) => {
    await apiFetch(`/api/vendor/enquiries/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'responded' }),
    });
    loadOverview();
  };

  const verStatus = vendorProfile?.verificationStatus || 'unverified';

  return (
    <PortalShell title="Overview">
      {loading || !data ? (
        <div className="space-y-4">
          <div className="h-36 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Verification / Onboarding Alert */}
          {verStatus !== 'verified' && (
            <div className="p-4 rounded-lg bg-[#FEF9C3] border border-[#E8C547] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#0B1B48] shrink-0 mt-0.5" />
                <div>
                  <div className="font-display font-bold text-sm text-[#0B1B48]">
                    {verStatus === 'pending' ? 'KYC & CAC Verification Under Review' : 'Complete KYC Verification to Publish Listings'}
                  </div>
                  <p className="text-xs text-[#334155]">
                    You can draft listings immediately, but publishing requires approved KYC credentials and an active subscription.
                  </p>
                </div>
              </div>
              <Link to="/vendor/kyc" className="px-4 py-2 rounded-md bg-[#0B1B48] text-white text-xs font-bold whitespace-nowrap">
                {verStatus === 'pending' ? 'View KYC Status' : 'Upload KYC Documents'}
              </Link>
            </div>
          )}

          {/* Welcome Hero Banner */}
          <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-2">
                {vendorProfile?.rcNumber && (
                  <span className="px-2.5 py-0.5 rounded bg-[#E8C547]/40 text-[#0B1B48] font-mono">{vendorProfile.rcNumber}</span>
                )}
                <span className="px-2.5 py-0.5 rounded bg-[#0B1B48] text-white">
                  {data.subscription ? `${data.subscription.planCode.toUpperCase()} PLAN` : 'NO ACTIVE PLAN'}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48]">
                Welcome back, {vendorProfile?.businessName}
              </h1>
              <p className="text-xs sm:text-sm text-[#5A6782] mt-1">
                Centralized operational workspace for your verified inventory, buyer leads, and listing promotions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                to="/vendor/promote"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold"
              >
                <Megaphone className="w-4 h-4" />
                <span>Promote Active Listing</span>
              </Link>
              <Link
                to="/vendor/add"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add New Property</span>
              </Link>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-[#DCE3F0] p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6782]">
                <span>TOTAL INVENTORY</span>
                <Building2 className="w-4 h-4 text-[#1B3688]" />
              </div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-2 tabular-nums">
                {data.stats.totalInventory} Assets
              </div>
              <div className="text-[11px] text-[#5A6782] mt-2 tabular-nums">
                {data.stats.publishedCount} Active · {data.stats.pendingCount} Review · {data.stats.draftCount} Draft
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DCE3F0] p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6782]">
                <span>PUBLISHED PORTFOLIO</span>
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-2 tabular-nums">
                {formatMoney(data.stats.totalPortfolioNgn)}
              </div>
              <div className="text-[11px] text-[#5A6782] mt-2">Active listed valuation</div>
            </div>

            <div className="bg-white rounded-lg border border-[#DCE3F0] p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6782]">
                <span>TOTAL VIEWS</span>
                <Eye className="w-4 h-4 text-[#1B3688]" />
              </div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-2 tabular-nums">
                {data.stats.totalViews.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#16A34A] font-semibold mt-2">Across public marketplace</div>
            </div>

            <div className="bg-white rounded-lg border border-[#DCE3F0] p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5A6782]">
                <span>BUYER INQUIRIES</span>
                <MessageSquare className="w-4 h-4 text-[#E8C547]" />
              </div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] mt-2 tabular-nums">
                {data.stats.totalLeads} Leads
              </div>
              <div className="text-[11px] text-[#5A6782] mt-2 tabular-nums">{data.stats.promotedCount} Active Promotions</div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              {/* Attention Listings */}
              <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-base text-[#0B1B48]">Listings Requiring Attention</h2>
                  <Link to="/vendor/properties" className="text-xs font-bold text-[#1B3688] hover:underline">
                    Manage All →
                  </Link>
                </div>

                {data.attentionProperties.length === 0 ? (
                  <p className="text-xs text-[#5A6782] py-3">All submitted properties are published and healthy.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.attentionProperties.map((prop) => (
                      <div key={prop.id} className="p-3.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] flex items-center gap-3">
                        <SafeImage src={prop.images[0]} alt={prop.title} className="w-14 h-14 rounded-md object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FEF9C3] text-[#0B1B48]">
                            {prop.status.replace('_', ' ')}
                          </span>
                          <div className="font-display font-bold text-xs text-[#0B1B48] truncate mt-1">{prop.title}</div>
                          <Link to={`/vendor/add?edit=${prop.id}`} className="text-[11px] font-bold text-[#1B3688] hover:underline">
                            Resume / Inspect →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Inquiries */}
              <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-base text-[#0B1B48]">Recent Inquiries & High-Intent Leads</h2>
                  <Link to="/vendor/leads" className="text-xs font-bold text-[#1B3688] hover:underline">
                    View All Leads →
                  </Link>
                </div>

                {data.recentLeads.length === 0 ? (
                  <p className="text-xs text-[#5A6782] py-4">No buyer inquiries received yet.</p>
                ) : (
                  <div className="divide-y divide-[#DCE3F0] border-t border-[#DCE3F0]">
                    {data.recentLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-sm text-[#0B1B48]">{lead.fullName}</span>
                            <span className="px-2 py-0.5 rounded bg-[#F4F6FA] border border-[#DCE3F0] text-[10px] font-bold uppercase text-[#1B3688]">
                              {lead.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#334155] mt-0.5 truncate">
                            {lead.propertyRef ? `${lead.propertyRef} — ` : ''}{lead.propertyTitle}
                          </div>
                          <div className="text-[11px] text-[#5A6782] mt-0.5">
                            {lead.phone} · {lead.email}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-md bg-[#E8C547] text-[#0B1B48] text-xs font-bold whitespace-nowrap"
                          >
                            Chat on WhatsApp
                          </a>
                          {lead.status === 'new' && (
                            <button
                              type="button"
                              onClick={() => markLeadResponded(lead.id)}
                              className="px-3 py-1.5 rounded-md bg-white border border-[#DCE3F0] text-[#0B1B48] text-xs font-semibold hover:bg-[#EEF2FA]"
                            >
                              Mark Responded
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Plan Allocation + Listing Booster */}
            <aside className="lg:col-span-4 space-y-5">
              <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A6782]">Plan Allocation</span>
                  <span className="px-2 py-0.5 rounded bg-[#E8C547]/40 text-[#0B1B48] text-[10px] font-bold uppercase">
                    {data.subscription ? data.subscription.planCode : 'Inactive'}
                  </span>
                </div>
                <div className="font-display font-extrabold text-2xl text-[#0B1B48] tabular-nums">
                  {data.stats.publishedCount} Active
                  <span className="text-xs font-normal text-[#5A6782] ml-2">
                    {data.subscription?.planCode === 'premium' ? 'Unlimited Quota' : '5 Listing Quota'}
                  </span>
                </div>
                {data.subscription && (
                  <p className="text-xs text-[#5A6782]">
                    Renews: {new Date(data.subscription.expiresAt).toLocaleDateString()}
                  </p>
                )}
                <Link
                  to="/vendor/billing"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1B3688] hover:underline pt-1"
                >
                  <span>Manage Agency Subscription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-[#0B1B48]">Listing Booster</span>
                  <span className="text-[11px] font-bold text-[#16A34A]">+340% Traffic</span>
                </div>
                <p className="text-xs text-[#5A6782]">Boost visibility across top Nigerian city and state property searches.</p>
                <div className="divide-y divide-[#DCE3F0] border-y border-[#DCE3F0]">
                  {(['promo_1w', 'promo_2w', 'promo_1m'] as const).map((code) => {
                    const pkg = PROMOTION_PACKAGES[code];
                    return (
                      <div key={code} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#0B1B48]">{pkg.name}</div>
                          <div className="text-[11px] text-[#5A6782]">{pkg.durationLabel}</div>
                        </div>
                        <div className="text-right font-display font-bold text-[#0B1B48] tabular-nums">
                          ₦{pkg.priceNgn.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link
                  to="/vendor/promote"
                  className="block text-center py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
                >
                  Boost a Listing Now
                </Link>
              </div>
            </aside>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
