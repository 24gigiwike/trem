import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, PhoneCall, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { UserAccount } from '../../shared/types';
import { TremLogo } from '../../components/TremLogo';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'seeker' | 'vendor' | 'agency') || 'agency';
  const [role, setRole] = useState<'seeker' | 'vendor' | 'agency'>(initialRole);
  const [step, setStep] = useState<1 | 2>(1);

  const { apiFetch, setAuthSession } = useApp();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+234 ');
  const [businessName, setBusinessName] = useState('');
  const [representativeRole, setRepresentativeRole] = useState('Principal Broker / Managing Director');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(true);

  const [otpInput, setOtpInput] = useState('');
  const [sandboxOtp, setSandboxOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pwdChecks = useMemo(
    () => ({
      len: password.length >= 8,
      upper: /[A-Z]/.test(password),
      num: /[0-9]/.test(password),
      sym: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const pwdScore = Object.values(pwdChecks).filter(Boolean).length * 25;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError('You must accept the TREM Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ token: string; user: UserAccount; sandboxOtpPreview?: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          role,
          businessName: role !== 'seeker' ? businessName : undefined,
          representativeRole: role !== 'seeker' ? representativeRole : undefined,
        }),
      });
      await setAuthSession(res.token, res.user);
      if (res.sandboxOtpPreview) setSandboxOtp(res.sandboxOtpPreview);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp: otpInput.trim() }),
      });
      if (role === 'seeker') {
        navigate('/seeker');
      } else {
        navigate('/vendor/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setLoading(false);
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
              TREM Auth / <span className="font-semibold text-[#0B1B48]">{role === 'agency' ? 'Real Estate Agency' : role === 'vendor' ? 'Independent Vendor' : 'Property Seeker'} Onboarding</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl text-[#0B1B48] mt-1">Create Your Verified TREM Account</h1>
            <p className="text-xs sm:text-sm text-[#5A6782] mt-1">
              Join Nigeria&apos;s verified network of accredited real estate agencies, property owners, and buyers.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-[#DCE3F0] text-xs">
            <span className="font-bold text-[#0B1B48]">Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'seeker' | 'vendor' | 'agency')}
              disabled={step === 2}
              className="font-bold text-[#1B3688] bg-transparent focus:outline-none"
            >
              <option value="agency">Agency Entity</option>
              <option value="vendor">Independent Vendor</option>
              <option value="seeker">Property Seeker</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-lg border border-[#DCE3F0] p-6 sm:p-8">
            <div className="grid grid-cols-3 gap-2 pb-6 mb-6 border-b border-[#DCE3F0] text-xs font-bold">
              <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#0B1B48]' : 'text-[#16A34A]'}`}>
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${step === 1 ? 'bg-[#0B1B48]' : 'bg-[#16A34A]'}`}>1</span>
                <span>Account Details</span>
              </div>
              <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#0B1B48]' : 'text-[#5A6782]'}`}>
                <span className={`w-6 h-6 rounded-md flex items-center justify-center ${step === 2 ? 'bg-[#0B1B48] text-white' : 'bg-[#EEF2FA] text-[#5A6782]'}`}>2</span>
                <span>OTP Confirmation</span>
              </div>
              <div className="flex items-center gap-2 text-[#5A6782]">
                <span className="w-6 h-6 rounded-md bg-[#EEF2FA] flex items-center justify-center">3</span>
                <span>{role === 'seeker' ? 'Seeker Watchlist' : 'Plan & KYC Setup'}</span>
              </div>
            </div>

            {step === 1 ? (
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
                    <h2 className="font-display font-bold text-sm text-[#0B1B48]">Portal Credentials</h2>

                    <div>
                      <label className="block text-xs font-bold mb-1">Portal Password *</label>
                      <div className="relative">
                        <input
                          type={showPwd ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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

                      <div className="mt-2 p-3 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] space-y-2 text-[11px]">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-[#5A6782]">PASSWORD STRENGTH</span>
                          <span className="tabular-nums text-[#0B1B48]">{pwdScore}%</span>
                        </div>
                        <div className="h-1.5 rounded-sm bg-[#DCE3F0] overflow-hidden">
                          <div
                            className={`h-full transition-all ${pwdScore >= 75 ? 'bg-[#16A34A]' : 'bg-[#E8C547]'}`}
                            style={{ width: `${pwdScore}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[#5A6782]">
                          {[
                            { ok: pwdChecks.len, text: '8+ characters' },
                            { ok: pwdChecks.upper, text: 'Uppercase letter' },
                            { ok: pwdChecks.num, text: 'Number included' },
                            { ok: pwdChecks.sym, text: 'Special symbol' },
                          ].map((c) => (
                            <span key={c.text} className={`flex items-center gap-1 ${c.ok ? 'text-[#16A34A] font-semibold' : ''}`}>
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>{c.text}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Confirm Portal Password *</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                      />
                      {confirmPassword && (
                        <span className={`text-[11px] font-semibold mt-1 block ${passwordsMatch ? 'text-[#16A34A]' : 'text-red-600'}`}>
                          {passwordsMatch ? 'Passwords match securely' : 'Passwords do not match'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 text-xs text-[#334155]">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5 accent-[#0B1B48]" />
                        <span>I agree to the TREM Terms of Service and Vendor Operating Guidelines.</span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-0.5 accent-[#0B1B48]" />
                        <span>I acknowledge the Privacy Policy and consent to NDPR & AML verification protocols.</span>
                      </label>
                    </div>
                  </div>
                </div>

                {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

                <div className="pt-4 border-t border-[#DCE3F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-[#5A6782]">
                    A 6-digit OTP code will be generated for initial identity confirmation.
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold whitespace-nowrap"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{loading ? 'Creating Account...' : 'Create Account & Verify'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="max-w-md mx-auto py-6 space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-[#EEF2FA] text-[#1B3688] flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-[#0B1B48]">Confirm 6-Digit OTP</h2>
                  <p className="text-xs text-[#5A6782] mt-1">Enter the verification code issued for {email}.</p>
                </div>

                {sandboxOtp && (
                  <div className="p-3.5 rounded-md bg-[#EEF2FA] border border-[#1B3688]/20 text-xs text-center">
                    Sandbox OTP Preview: <strong className="font-mono text-base text-[#0B1B48] ml-1">{sandboxOtp}</strong>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6 digits"
                    className="w-full px-4 py-3 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-center font-mono text-lg tracking-widest"
                  />
                </div>

                {error && <p className="text-xs font-semibold text-red-600 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Verifying...' : 'Confirm OTP & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-[#0B1B48] text-white rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#E8C547] font-display font-bold text-base">
                <ShieldCheck className="w-5 h-5" />
                <span>Why TREM Requires Verification</span>
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
