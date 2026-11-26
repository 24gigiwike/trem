import { Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, FileCheck, CalendarCheck2, Sparkles } from 'lucide-react';
import { PROMOTION_PACKAGES, SUBSCRIPTION_PLANS } from '../../shared/commercial';

export function PricingPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-14">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1B3688]">Vendor & Agency Subscriptions</span>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0B1B48] mt-1">
          Transparent Membership & Promotion Pricing
        </h1>
        <p className="text-sm text-[#5A6782] mt-2">
          Subscribe to enlist title-verified properties, receive direct buyer inquiries across Nigeria, and amplify priority listings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {(['standard', 'premium'] as const).map((code) => {
          const plan = SUBSCRIPTION_PLANS[code];
          const isPremium = code === 'premium';
          return (
            <div
              key={code}
              className={`rounded-lg p-6 sm:p-8 flex flex-col justify-between ${
                isPremium ? 'bg-[#0B1B48] text-white border-2 border-[#E8C547]' : 'bg-white text-[#0B1B48] border border-[#DCE3F0]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isPremium ? 'text-[#E8C547]' : 'text-[#1B3688]'}`}>
                    {plan.audience}
                  </span>
                  {isPremium && (
                    <span className="px-2.5 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-[10px] font-bold uppercase">
                      Most Popular
                    </span>
                  )}
                </div>
                <h2 className="font-display font-extrabold text-2xl mt-2">{plan.name}</h2>
                <p className={`text-xs mt-1 ${isPremium ? 'text-slate-300' : 'text-[#5A6782]'}`}>{plan.tagline}</p>

                <div className="mt-5 font-display font-extrabold text-4xl tabular-nums">
                  ₦{plan.monthlyPriceNgn.toLocaleString()}
                  <span className={`text-sm font-normal ${isPremium ? 'text-slate-300' : 'text-[#5A6782]'}`}> / month</span>
                </div>
                <p className={`text-xs mt-1 ${isPremium ? 'text-slate-300' : 'text-[#5A6782]'}`}>
                  Discounts available on 3, 6, and 12-month billing cycles (+7.5% statutory VAT).
                </p>

                <ul className="mt-6 space-y-2.5 text-xs pt-4 border-t border-current/15">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPremium ? 'text-[#E8C547]' : 'text-[#16A34A]'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={`/auth?role=${isPremium ? 'agency' : 'vendor'}`}
                className={`mt-8 block text-center py-3 rounded-md text-xs font-bold transition-colors ${
                  isPremium
                    ? 'bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48]'
                    : 'bg-[#0B1B48] hover:bg-[#1B3688] text-white'
                }`}
              >
                {isPremium ? 'Start Agency Onboarding' : 'Start Independent Vendor Account'}
              </Link>
            </div>
          );
        })}
      </div>

      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1B3688]">Listing Amplification</span>
          <h2 className="font-display font-extrabold text-2xl text-[#0B1B48] mt-1">Property Promotion Packages</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(['promo_1w', 'promo_2w', 'promo_1m'] as const).map((code) => {
            const pkg = PROMOTION_PACKAGES[code];
            return (
              <div
                key={code}
                className={`rounded-lg p-6 bg-white border ${
                  pkg.popular ? 'border-2 border-[#E8C547]' : 'border-[#DCE3F0]'
                } flex flex-col justify-between`}
              >
                <div>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] text-[10px] font-bold uppercase">
                    {pkg.tierLabel}
                  </span>
                  <h3 className="font-display font-bold text-xl text-[#0B1B48] mt-2">{pkg.durationLabel}</h3>
                  <div className="mt-3 font-display font-extrabold text-3xl text-[#0B1B48] tabular-nums">
                    ₦{pkg.priceNgn.toLocaleString()}
                  </div>
                  <ul className="mt-4 space-y-2 text-xs text-[#334155] pt-3 border-t border-[#DCE3F0]">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#1B3688] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/vendor/promote"
                  className="mt-6 block text-center py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold"
                >
                  Promote a Listing
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function HowItWorksPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-[#1B3688]">Marketplace Protocol</span>
        <h1 className="font-display font-extrabold text-3xl text-[#0B1B48] mt-1">How TREM Protects Buyers & Vendors</h1>
        <p className="text-sm text-[#5A6782] mt-2">
          Every listing moves through identity accreditation, cadastral title checks, and direct inspection scheduling before public syndication.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: ShieldCheck,
            title: '1. CAC & SCUML Accreditation',
            body: 'Agencies and independent vendors submit corporate registration (CAC), Federal TIN, and SCUML / identity documents reviewed by TREM Compliance.',
          },
          {
            icon: FileCheck,
            title: '2. Title & Survey Moderation',
            body: 'Listings require title classification (C of O, Governor’s Consent, Gazette), survey plan identifiers, and verified media before publication.',
          },
          {
            icon: CalendarCheck2,
            title: '3. Direct Inspection & Verification',
            body: 'Seekers schedule in-person site visits or live video walkthroughs directly with accredited agencies and verified property owners.',
          },
        ].map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#EEF2FA] text-[#1B3688] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-display font-bold text-lg text-[#0B1B48]">{step.title}</h2>
              <p className="text-xs text-[#5A6782] leading-relaxed">{step.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LegalTrustPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="font-display font-extrabold text-3xl text-[#0B1B48]">Legal, Trust & Compliance Framework</h1>

      <section id="terms" className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-2">
        <h2 className="font-display font-bold text-lg text-[#0B1B48]">Marketplace Terms of Service</h2>
        <p className="text-xs text-[#334155] leading-relaxed">
          Vendors and agencies publishing on TREM certify that all title documents, survey coordinates, and property representations are genuine and authorized by the legal title holder. Fraudulent submissions lead to permanent suspension and audit logging.
        </p>
      </section>

      <section id="privacy" className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-2">
        <h2 className="font-display font-bold text-lg text-[#0B1B48]">NDPR Privacy & Data Safeguards</h2>
        <p className="text-xs text-[#334155] leading-relaxed">
          Seeker enquiry details and vendor KYC documents are protected under Nigeria Data Protection Regulation (NDPR) access controls. KYC documents are restricted to the submitting vendor and authorized platform compliance reviewers.
        </p>
      </section>

      <section id="cac" className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-2">
        <h2 className="font-display font-bold text-lg text-[#0B1B48]">CAC & SCUML Verification Standards</h2>
        <p className="text-xs text-[#334155] leading-relaxed">
          Corporate agencies provide RC/BN numbers, Federal TIN, and SCUML / REDAN licensure. Independent vendors submit government-issued ID and proof of authority prior to receiving publishing privileges.
        </p>
      </section>

      <section id="faq" className="bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-3">
        <h2 className="font-display font-bold text-lg text-[#0B1B48]">Frequently Asked Questions</h2>
        <div className="space-y-3 text-xs text-[#334155]">
          <div>
            <strong className="text-[#0B1B48]">How do subscriptions work?</strong>
            <p>Standard (₦5,000/mo) supports up to 5 concurrent listings. Premium (₦9,500/mo) unlocks unlimited inventory and priority agency microsite placement.</p>
          </div>
          <div>
            <strong className="text-[#0B1B48]">Can buyers schedule remote video walkthroughs before visiting in person?</strong>
            <p>Yes. Every listing supports in-person or live video walkthrough inspection requests routed straight to the verified vendor.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
