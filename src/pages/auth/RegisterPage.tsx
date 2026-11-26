import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, PhoneCall, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PublicAccountRole } from '../../lib/localStore';
import { TremLogo } from '../../components/TremLogo';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const rawRole = searchParams.get('role');
  const initialRole: PublicAccountRole =
    rawRole === 'seeker' || rawRole === 'vendor' || rawRole === 'agency' ? rawRole : 'agency';
  const [role, setRole] = useState<PublicAccountRole>(initialRole);

  const { registerOpen } = useApp();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+234 ');
  const [businessName, setBusinessName] = useState('');
  const [representativeRole, setRepresentativeRole] = useState('Principal Broker / Managing Director');
  const [passwordVisual, setPasswordVisual] = useState('');
  const [confirmPasswordVisual, setConfirmPasswordVisual] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(true);

  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide a phone number.');
      return;
    }
    if (role !== 'seeker' && !businessName.trim()) {
      setError('Please provide your business or agency name.');
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError('You must accept the TREM Terms of Service and Privacy Policy.');
      return;
    }

    setError('');
    // Clear visual password fields without storing or transmitting them
    setPasswordVisual('');
    setConfirmPasswordVisual('');

    registerOpen({
      firstName,
      lastName,
      email,
      phone,
      role,
      businessName: role !== 'seeker' ? businessName : undefined,
      representativeRole: role !== 'seeker' ? representativeRole : undefined,
    });

    if (role === 'seeker') {
      navigate('/seeker');
    } else {
      navigate('/vendor');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0B1B48] flex flex-col">
      <header className="bg-white border-b border-[#DCE3F0] h-16 px-4 sm:px-8 flex items-center justify-between">
        <Link to="/">
          <TremLogo />
        </Link>
        <Link to="/" className="text-xs font-bold text-[#0B1B48] hover:underline">
          Return to Marketplace
        </Link>
      </header>

      <main className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs text-[#5A6782]">
              TREM Portal / <span className="font-semibold text-[#0B1B48]">{role === 'agency' ? 'Real Estate Agency' : role === 'vendor' ? 'Independent Vendor' : 'Property Seeker'} Onboarding</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-[#0B1B48] mt-1">Create Your TREM Profile</h1>
            <p className="text-xs sm:text-sm text-[#5A6782] mt-1">
              Enter your details below for immediate access to your Nigerian real estate workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-[#DCE3F0] text-xs">
            <span className="font-bold text-[#0B1B48]">Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PublicAccountRole)}
              className="font-bold text-[#1B3688] bg-transparent focus:outline-none"
            >
              <option value="agency">Real Estate Agency</option>
              <option value="vendor">Independent Vendor</option>
              <option value="seeker">Property Seeker</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-lg border border-[#DCE3F0] p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-2 pb-6 mb-6 border-b border-[#DCE3F0] text-xs font-bold">
              <div className="flex items-center gap-2 text-[#0B1B48]">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-white bg-[#0B1B48]">1</span>
                <span>Profile Details</span>
              </div>
              <div className="flex items-center gap-2 text-[#5A6782]">
                <span className="w-6 h-6 rounded-md bg-[#EEF2FA] flex items-center justify-center">2</span>
                <span>{role === 'seeker' ? 'Seeker Dashboard' : 'Vendor / Agency Workspace'}</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-sm text-[#0B1B48]">
                    {role === 'seeker' ? 'Buyer / Seeker Identity' : 'Broker / Agent Identity'}
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Babatunde"
                        className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Adeleke"
                        className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                      />
                    </div>
                  </div>

                  {role !== 'seeker' && (
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        {role === 'agency' ? 'Agency / Brokerage Name *' : 'Business / Vendor Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Mainland Crest Realtors Ltd"
                        className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold mb-1">Work / Official Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.ng"
                      className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Phone Number (WhatsApp Enabled) *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 814 990 4421"
                      className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                    />
                  </div>

                  {role !== 'seeker' && (
                    <div>
                      <label className="block text-xs font-bold mb-1">Account Representative Role *</label>
                      <select
                        value={representativeRole}
                        onChange={(e) => setRepresentativeRole(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                      >
                        <option>Principal Broker / Managing Director</option>
                        <option>Operations & Listing Manager</option>
                        <option>Independent Property Owner</option>
                        <option>Legal Compliance Officer</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="font-display font-bold text-sm text-[#0B1B48]">Portal Preferences</h2>

                  <div>
                    <label className="block text-xs font-bold mb-1">Access Passphrase (Optional)</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={passwordVisual}
                        onChange={(e) => setPasswordVisual(e.target.value)}
                        placeholder="Optional visual passphrase"
                        autoComplete="off"
                        className="w-full px-3 py-2.5 pr-10 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6782]"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Confirm Passphrase (Optional)</label>
                    <input
                      type="password"
                      value={confirmPasswordVisual}
                      onChange={(e) => setConfirmPasswordVisual(e.target.value)}
                      placeholder="Optional visual confirmation"
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs text-[#5A6782]">
                    Your profile details are saved locally in this browser so your selected workspace persists across reloads. Passphrases are never stored or transmitted.
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-[#334155]">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-[#0B1B48]" />
                      <span>I agree to the TREM Terms of Service and Vendor Operating Guidelines.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-0.5 accent-[#0B1B48]" />
                      <span>I acknowledge the Privacy Policy and marketplace compliance standards.</span>
                    </label>
                  </div>
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

              <div className="pt-4 border-t border-[#DCE3F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link to={`/auth?mode=login&role=${role}`} className="text-xs font-bold text-[#1B3688] hover:underline">
                  Already have a profile? Sign In →
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold whitespace-nowrap"
                >
                  <span>Continue to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-[#0B1B48] text-white rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#E8C547] font-display font-bold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>TREM Marketplace Standards</span>
              </div>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div>
                  <div className="font-bold text-white">Anti-Money Laundering (SCUML)</div>
                  <p>Adherence to Special Control Unit against Money Laundering keeps illicit capital out of verified properties.</p>
                </div>
                <div>
                  <div className="font-bold text-white">Title Registry & Legal Clarity</div>
                  <p>Verified agencies document C of O, Governor&apos;s Consent, and Gazette status clearly prior to listing.</p>
                </div>
                <div>
                  <div className="font-bold text-white">Zero-Duplicate Listing Protection</div>
                  <p>Prevents cloned broker listings, protecting exclusive mandates and verified market authority.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-3">
              <h3 className="font-display font-bold text-sm text-[#0B1B48]">Need Onboarding Help?</h3>
              <p className="text-xs text-[#5A6782]">Our corporate accounts desk assists developer firms with bulk documentation.</p>
              <div className="p-3 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] flex items-center gap-2.5 text-xs">
                <PhoneCall className="w-4 h-4 text-[#1B3688]" />
                <div>
                  <div className="font-bold text-[#0B1B48]">Support Desk (Nigeria)</div>
                  <div className="text-[#5A6782] tabular-nums">+234 (0) 800 TREM REAL</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
