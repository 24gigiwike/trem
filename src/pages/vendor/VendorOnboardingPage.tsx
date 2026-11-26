import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, CreditCard, Lock, ShieldCheck, UploadCloud, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  BILLING_DURATIONS,
  calculateSubscriptionQuote,
  SUBSCRIPTION_PLANS,
} from '../../shared/commercial';
import { PortalShell } from '../../components/PortalShell';

export function VendorOnboardingPage() {
  const { vendorProfile, apiFetch, refreshSession } = useApp();
  const navigate = useNavigate();

  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [entityType, setEntityType] = useState<'agency' | 'vendor'>(vendorProfile?.entityType === 'vendor' ? 'vendor' : 'agency');
  const [businessName, setBusinessName] = useState(vendorProfile?.businessName || '');
  const [representativeName, setRepresentativeName] = useState(vendorProfile?.representativeName || '');
  const [address, setAddress] = useState(vendorProfile?.address || '');
  const [city, setCity] = useState(vendorProfile?.city || 'Lagos');
  const [state, setState] = useState(vendorProfile?.state || 'Lagos');

  const [planCode, setPlanCode] = useState<'standard' | 'premium'>(entityType === 'agency' ? 'premium' : 'standard');
  const [billingMonths, setBillingMonths] = useState<1 | 3 | 6 | 12>(12);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');

  const [orderRef, setOrderRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Step 3 KYC state
  const [rcNumber, setRcNumber] = useState(vendorProfile?.rcNumber || '');
  const [tinNumber, setTinNumber] = useState(vendorProfile?.tinNumber || '');
  const [scumlNumber, setScumlNumber] = useState(vendorProfile?.scumlNumber || '');
  const [idType, setIdType] = useState('National ID (NIN Slip)');
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ docType: 'representative_id' | 'cac_cert' | 'scuml_cert'; docLabel: string; fileName: string; fileUrl: string }>>([]);
  const [kycSubmitted, setKycSubmitted] = useState(false);

  const quote = calculateSubscriptionQuote(planCode, billingMonths);

  const handleStage1Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    try {
      await apiFetch('/api/vendor/profile', {
        method: 'PATCH',
        body: JSON.stringify({ businessName, representativeName, address, city, state }),
      });
      setStage(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save vendor details.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    try {
      const idempotencyKey = `sub_${vendorProfile?.id || 'v'}_${planCode}_${billingMonths}_${Date.now()}`;
      const orderRes = await apiFetch<{ order: { reference: string } }>('/api/billing/orders', {
        method: 'POST',
        body: JSON.stringify({
          orderType: 'subscription',
          planCode,
          billingMonths,
          paymentMethod,
          idempotencyKey,
        }),
      });
      // Sandbox signed webhook verification (server-side HMAC check & entitlement activation)
      await apiFetch(`/api/billing/sandbox-confirm/${orderRes.order.reference}`, { method: 'POST' });
      await refreshSession();
      setOrderRef(orderRes.order.reference);
      setStage(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'representative_id' | 'cac_cert' | 'scuml_cert',
    docLabel: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const res = await apiFetch<{ fileName: string; fileUrl: string }>('/api/uploads', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, dataBase64: base64 }),
      });
      setUploadedDocs((prev) => [...prev, { docType, docLabel, fileName: res.fileName, fileUrl: res.fileUrl }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    try {
      await apiFetch('/api/vendor/kyc', {
        method: 'POST',
        body: JSON.stringify({
          rcNumber,
          tinNumber,
          scumlNumber,
          documents:
            uploadedDocs.length > 0
              ? uploadedDocs
              : [{ docType: 'representative_id', docLabel: idType, fileName: `${idType.replace(/\s+/g, '_')}.pdf`, fileUrl: '/uploads/id_pending.pdf' }],
        }),
      });
      await refreshSession();
      setKycSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KYC submission failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PortalShell title="Vendor Onboarding">
      <div className="space-y-6">
        {/* Stepper */}
        <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Institutional Vendor Enlistment</span>
            <h1 className="font-display font-extrabold text-2xl text-[#0B1B48]">
              {stage === 1
                ? 'Step 1: Plan & Profile Registration'
                : stage === 2
                ? 'Step 2: Subscription Checkout & Duration'
                : 'Step 3: Payment Confirmed & KYC Accreditation'}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            {[
              { n: 1, label: '1. Plan & Register' },
              { n: 2, label: '2. Checkout' },
              { n: 3, label: '3. Verification' },
            ].map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setStage(s.n as 1 | 2 | 3)}
                className={`px-3 py-1.5 rounded-md border ${
                  stage === s.n
                    ? 'bg-[#0B1B48] text-white border-[#0B1B48]'
                    : stage > s.n
                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#16A34A]/30'
                    : 'bg-[#F4F6FA] text-[#5A6782] border-[#DCE3F0]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* STAGE 1 */}
        {stage === 1 && (
          <form onSubmit={handleStage1Continue} className="space-y-6">
            <div className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-5">
              <h2 className="font-display font-bold text-lg text-[#0B1B48]">Select Vendor Classification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setEntityType('agency');
                    setPlanCode('premium');
                  }}
                  className={`text-left p-4 rounded-md border-2 transition-all ${
                    entityType === 'agency' ? 'border-[#0B1B48] bg-[#EEF2FA]' : 'border-[#DCE3F0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-[#0B1B48]">
                    <Building2 className="w-4 h-4 text-[#1B3688]" />
                    <span>Real Estate Agency</span>
                  </div>
                  <p className="text-xs text-[#5A6782] mt-1">For registered corporate brokerages and development groups.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntityType('vendor');
                    setPlanCode('standard');
                  }}
                  className={`text-left p-4 rounded-md border-2 transition-all ${
                    entityType === 'vendor' ? 'border-[#0B1B48] bg-[#EEF2FA]' : 'border-[#DCE3F0] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-[#0B1B48]">
                    <UserCheck className="w-4 h-4 text-[#1B3688]" />
                    <span>Individual Vendor</span>
                  </div>
                  <p className="text-xs text-[#5A6782] mt-1">For independent property owners, solo realtors, and private landlords.</p>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold mb-1">Business / Agency Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Full Legal Representative Name *</label>
                  <input
                    type="text"
                    required
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Office / Street Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">City *</label>
                    <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">State *</label>
                    <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(['standard', 'premium'] as const).map((code) => {
                const p = SUBSCRIPTION_PLANS[code];
                const selected = planCode === code;
                return (
                  <div
                    key={code}
                    onClick={() => setPlanCode(code)}
                    className={`cursor-pointer rounded-lg p-6 transition-all ${
                      selected
                        ? 'bg-[#0B1B48] text-white border-2 border-[#E8C547]'
                        : 'bg-white text-[#0B1B48] border border-[#DCE3F0]'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider opacity-80">{p.audience}</div>
                    <h3 className="font-display font-extrabold text-xl mt-1">{p.name}</h3>
                    <div className="mt-3 font-display font-extrabold text-3xl tabular-nums">
                      ₦{p.monthlyPriceNgn.toLocaleString()} <span className="text-xs font-normal">/ mo</span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${selected ? 'text-[#E8C547]' : 'text-[#16A34A]'}`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {error && <p className="text-xs font-bold text-red-600">{error}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
              >
                <span>Continue to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STAGE 2 */}
        {stage === 2 && (
          <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Select Billing Duration</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BILLING_DURATIONS.map((dur) => {
                    const q = calculateSubscriptionQuote(planCode, dur.months);
                    const active = billingMonths === dur.months;
                    return (
                      <button
                        key={dur.months}
                        type="button"
                        onClick={() => setBillingMonths(dur.months)}
                        className={`text-left p-4 rounded-md border-2 transition-all ${
                          active ? 'bg-[#0B1B48] text-white border-[#E8C547]' : 'bg-[#F4F6FA] text-[#0B1B48] border-[#DCE3F0]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{dur.label}</span>
                          {dur.badge && <span className="px-2 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-[10px]">{dur.badge}</span>}
                        </div>
                        <div className="font-display font-extrabold text-xl mt-2 tabular-nums">
                          ₦{q.netNgn.toLocaleString()}
                        </div>
                        <div className={`text-[11px] mt-0.5 ${active ? 'text-slate-300' : 'text-[#5A6782]'}`}>
                          Before 7.5% Federal VAT
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-lg text-[#0B1B48]">Payment Method (Sandbox Gateway)</h2>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Signed Webhook Verification</span>
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

                <div className="p-4 rounded-md bg-[#EEF2FA] text-xs text-[#334155]">
                  Sandbox Mode: Submitting creates a server-side payment order in Nigerian Naira (₦) and dispatches a signed webhook (`X-TREM-Signature`) to verify and activate your subscription entitlement. No live card charge occurs.
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4 bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
              <h3 className="font-display font-bold text-lg text-[#0B1B48]">Order Summary</h3>
              <div className="p-4 rounded-md bg-[#0B1B48] text-white space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#E8C547]">Subscribed Tier</div>
                <div className="font-display font-bold text-base">{quote.plan.name}</div>
                <div className="text-xs text-slate-300">{quote.duration.label}</div>
              </div>

              <div className="space-y-2 text-xs border-b border-[#DCE3F0] pb-3">
                <div className="flex justify-between">
                  <span className="text-[#5A6782]">Base Subscription Fee</span>
                  <span className="font-bold tabular-nums">₦{quote.grossNgn.toLocaleString()}</span>
                </div>
                {quote.discountNgn > 0 && (
                  <div className="flex justify-between text-[#16A34A]">
                    <span>Term Discount</span>
                    <span className="font-bold tabular-nums">-₦{quote.discountNgn.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#5A6782]">Federal VAT (7.5%)</span>
                  <span className="font-bold tabular-nums">₦{quote.vatNgn.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase text-[#5A6782]">Total Payable</div>
                <div className="font-display font-extrabold text-3xl text-[#0B1B48] tabular-nums">
                  ₦{quote.totalNgn.toLocaleString()}
                </div>
              </div>

              {error && <p className="text-xs font-bold text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{processing ? 'Verifying Order...' : `Pay ₦${quote.totalNgn.toLocaleString()} & Continue`}</span>
              </button>
            </aside>
          </form>
        )}

        {/* STAGE 3 */}
        {stage === 3 && (
          <div className="space-y-6">
            {orderRef && (
              <div className="bg-[#071336] text-white rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-[10px] font-bold uppercase">
                    Payment Verified ({orderRef})
                  </span>
                  <h2 className="font-display font-extrabold text-2xl mt-2">Congratulations! Subscription Activated.</h2>
                  <p className="text-xs text-slate-300 mt-1">Complete your CAC & SCUML KYC accreditation below to unlock property publishing.</p>
                </div>
                <Link to="/vendor/add" className="px-5 py-2.5 rounded-md bg-[#E8C547] text-[#0B1B48] text-xs font-bold whitespace-nowrap">
                  Draft a Property Now
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmitKyc} className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-5">
              <div className="flex items-center gap-2 font-display font-bold text-lg text-[#0B1B48]">
                <ShieldCheck className="w-5 h-5 text-[#1B3688]" />
                <span>Official Compliance Hub — Upload KYC & CAC Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">CAC Registration Number (RC / BN)</label>
                  <input type="text" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} placeholder="RC 1498203" className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Federal Tax ID (TIN / JTB)</label>
                  <input type="text" value={tinNumber} onChange={(e) => setTinNumber(e.target.value)} placeholder="TIN-2940294-0001" className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">SCUML / REDAN Certificate No</label>
                  <input type="text" value={scumlNumber} onChange={(e) => setScumlNumber(e.target.value)} placeholder="SCUML/RN-0428" className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2">Designated Representative ID</label>
                  <select value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full mb-2 px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs">
                    <option>National ID (NIN Slip)</option>
                    <option>Driver&apos;s License</option>
                    <option>International Passport</option>
                  </select>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-[#1B3688]/40 bg-[#F4F6FA] cursor-pointer text-xs font-bold text-[#1B3688]">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload ID File</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocUpload(e, 'representative_id', idType)} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">CAC Certificate</label>
                  <label className="flex items-center justify-center gap-2 p-5 rounded-md border border-dashed border-[#1B3688]/40 bg-[#F4F6FA] cursor-pointer text-xs font-bold text-[#1B3688]">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload CAC Document</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocUpload(e, 'cac_cert', 'CAC Certificate')} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">SCUML / REDAN License</label>
                  <label className="flex items-center justify-center gap-2 p-5 rounded-md border border-dashed border-[#1B3688]/40 bg-[#F4F6FA] cursor-pointer text-xs font-bold text-[#1B3688]">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload SCUML Certificate</span>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocUpload(e, 'scuml_cert', 'SCUML Compliance')} className="hidden" />
                  </label>
                </div>
              </div>

              {uploadedDocs.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-[#0B1B48]">Attached Compliance Files:</span>
                  {uploadedDocs.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[#16A34A] font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{d.docLabel} — {d.fileName}</span>
                    </div>
                  ))}
                </div>
              )}

              {kycSubmitted ? (
                <div className="p-4 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-bold flex items-center justify-between gap-3">
                  <span>Documents submitted to TREM Compliance Review Queue.</span>
                  <button type="button" onClick={() => navigate('/vendor')} className="px-4 py-2 rounded-md bg-[#0B1B48] text-white">
                    Go to Vendor Dashboard
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-3 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
                >
                  {processing ? 'Submitting...' : 'Submit Documents for Verification'}
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
