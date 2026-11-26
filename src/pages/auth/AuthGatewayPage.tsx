import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, KeyRound, Search, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { UserAccount } from '../../shared/types';
import { TremLogo } from '../../components/TremLogo';

export function AuthGatewayPage() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as 'seeker' | 'vendor' | 'agency') || 'agency';
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'select';

  const [mode, setMode] = useState<'select' | 'login' | 'forgot'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'vendor' | 'agency'>(initialRole);

  const { apiFetch, setAuthSession } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sandboxOtp, setSandboxOtp] = useState('');
  const [resetStage, setResetStage] = useState<'request' | 'confirm' | 'done'>('request');

  const nextUrl = searchParams.get('next');

  const routeAfterLogin = (user: UserAccount) => {
    if (nextUrl) {
      navigate(nextUrl);
      return;
    }
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'seeker') navigate('/seeker');
    else navigate('/vendor');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await apiFetch<{ token: string; user: UserAccount }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await setAuthSession(res.token, res.user);
      routeAfterLogin(res.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const fillDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('TremDemo2026!');
    setMode('login');
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await apiFetch<{ sent: boolean; sandboxOtpPreview?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      });
      if (res.sandboxOtpPreview) setSandboxOtp(res.sandboxOtpPreview);
      setResetStage('confirm');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to send reset code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword }),
      });
      setResetStage('done');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#0B1B48] flex flex-col">
      <header className="bg-white border-b border-[#DCE3F0] h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <TremLogo />
          </Link>
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5A6782]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1B3688]" />
            <span>Encrypted Account Portal</span>
          </span>
        </div>

        <Link to="/" className="text-xs font-bold text-[#0B1B48] hover:underline whitespace-nowrap">
          Return to Marketplace
        </Link>
      </header>

      <div className="bg-[#071336] text-white border-b border-white/10">
        <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-block border-l-2 border-[#E8C547] pl-2.5 text-[#E8C547] text-[10px] font-bold uppercase tracking-wider mb-2">
              Nigerian Real Estate Portal · 36 States & FCT Abuja
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Welcome to TREM</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              The Real Estate Marketplace. Choose your account category or sign into your verified workspace.
            </p>
          </div>

          <div className="inline-flex bg-[#0B1B48] p-1 rounded-md border border-white/15 self-start shrink-0">
            <button
              type="button"
              onClick={() => setMode('select')}
              className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                mode === 'select' ? 'bg-[#E8C547] text-[#0B1B48]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Create an Account
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                mode !== 'select' ? 'bg-[#E8C547] text-[#0B1B48]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Log In to Existing Account
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 py-8">
        {mode === 'select' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Step 01 of 03</span>
                <h2 className="font-display font-extrabold text-2xl text-[#0B1B48]">Choose Your Account Category</h2>
                <p className="text-xs text-[#5A6782] mt-0.5">Select the profile type that matches your marketplace role.</p>
              </div>
              <span className="px-3 py-1.5 rounded-md bg-white border border-[#DCE3F0] text-[#1B3688] text-xs font-bold">
                SCUML & NDPR Compliant Onboarding
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Seeker */}
              <div
                onClick={() => setSelectedRole('seeker')}
                className={`cursor-pointer rounded-lg p-6 flex flex-col justify-between transition-colors ${
                  selectedRole === 'seeker'
                    ? 'bg-white border-2 border-[#0B1B48]'
                    : 'bg-white border border-[#DCE3F0] hover:border-[#0B1B48]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-[#EEF2FA] text-[#1B3688] flex items-center justify-center">
                      <Search className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] text-[10px] font-bold uppercase">Buyer / Seeker</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B1B48]">Property Seeker & Buyer</h3>
                  <p className="text-xs text-[#5A6782] mt-1.5 leading-relaxed">
                    Discover vetted residential, commercial, and land titles with Governor&apos;s Consent or C of O, direct broker lines, and scheduled inspections.
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#DCE3F0] space-y-2 text-xs text-[#334155]">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-[#1B3688]">Account Privileges</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Free account with full property directory access</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Direct broker & property owner enquiries</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Saved watchlist & inspection booking</span></div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRole('seeker')}
                  className={`mt-6 w-full py-2.5 rounded-md text-xs font-bold ${
                    selectedRole === 'seeker' ? 'bg-[#0B1B48] text-white' : 'bg-[#EEF2FA] text-[#0B1B48]'
                  }`}
                >
                  {selectedRole === 'seeker' ? 'Selected Seeker Account' : 'Select Seeker Account'}
                </button>
              </div>

              {/* Independent Vendor */}
              <div
                onClick={() => setSelectedRole('vendor')}
                className={`cursor-pointer rounded-lg p-6 flex flex-col justify-between transition-colors ${
                  selectedRole === 'vendor'
                    ? 'bg-white border-2 border-[#0B1B48]'
                    : 'bg-white border border-[#DCE3F0] hover:border-[#0B1B48]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-[#EEF2FA] text-[#1B3688] flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] text-[10px] font-bold uppercase">Sole Proprietor</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B1B48]">Independent Vendor & Landlord</h3>
                  <p className="text-xs text-[#5A6782] mt-1.5 leading-relaxed">
                    Enlist personal titles, manage prospective buyers directly, reach active buyers across Nigeria, and promote priority properties.
                  </p>
                  <div className="mt-4 pt-4 border-t border-[#DCE3F0] space-y-2 text-xs text-[#334155]">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-[#1B3688]">Account Privileges</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Standard Package (Up to 5 active properties)</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Direct WhatsApp & portal lead routing</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Verified Individual Vendor KYC accreditation</span></div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRole('vendor')}
                  className={`mt-6 w-full py-2.5 rounded-md text-xs font-bold ${
                    selectedRole === 'vendor' ? 'bg-[#0B1B48] text-white' : 'bg-[#EEF2FA] text-[#0B1B48]'
                  }`}
                >
                  {selectedRole === 'vendor' ? 'Selected Independent Vendor' : 'Select Independent Vendor'}
                </button>
              </div>

              {/* Real Estate Agency */}
              <div
                onClick={() => setSelectedRole('agency')}
                className={`cursor-pointer rounded-lg p-6 flex flex-col justify-between transition-colors ${
                  selectedRole === 'agency'
                    ? 'bg-[#0B1B48] text-white border-2 border-[#E8C547]'
                    : 'bg-[#0B1B48] text-white border border-white/15 opacity-95'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-white/10 text-[#E8C547] flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-[10px] font-bold uppercase">
                      Recommended for Firms
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Real Estate Agency & Brokerage</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Dedicated workspace for registered brokerages and developers. Multi-property syndication, team agent management, and branded agency microsite.
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/15 space-y-2 text-xs text-slate-200">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-[#E8C547]">Agency Privileges</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#E8C547] shrink-0" /><span>Premium Package (Unlimited property listings)</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#E8C547] shrink-0" /><span>Branded Public Agency microsite & team agents</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#E8C547] shrink-0" /><span>SCUML & CAC verified corporate badge</span></div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRole('agency')}
                  className="mt-6 w-full py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
                >
                  {selectedRole === 'agency' ? 'Active Choice: Agency Account' : 'Select Agency Account'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DCE3F0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">Active Selection</span>
                <div className="font-display font-bold text-base text-[#0B1B48]">
                  {selectedRole === 'seeker'
                    ? 'Property Seeker & Buyer'
                    : selectedRole === 'vendor'
                    ? 'Independent Vendor & Landlord'
                    : 'Real Estate Agency & Brokerage'}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => setMode('login')} className="text-xs font-bold text-[#1B3688] hover:underline">
                  Already have an account? Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/auth/register?role=${selectedRole}`)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
                >
                  <span>Continue to Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div className="max-w-md mx-auto bg-white rounded-lg border border-[#DCE3F0] p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-[#0B1B48]">Sign In to TREM Portal</h2>
              <p className="text-xs text-[#5A6782] mt-1">Access your Seeker watchlist or Vendor / Agency workspace.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#0B1B48]">Password</label>
                  <button type="button" onClick={() => setMode('forgot')} className="text-[11px] font-semibold text-[#1B3688] hover:underline">
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>

              {authError && <p className="text-xs font-semibold text-red-600">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold"
              >
                {authLoading ? 'Signing in...' : 'Sign In to Workspace'}
              </button>
            </form>

            <div className="pt-4 border-t border-[#DCE3F0] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">Sandbox Test Accounts</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoUser('apex@trem.ng')}
                  className="py-2 px-3 rounded-md bg-[#EEF2FA] hover:bg-[#DCE3F0] text-[#0B1B48] text-xs font-semibold"
                >
                  Demo Agency (Apex)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoUser('seeker@trem.ng')}
                  className="py-2 px-3 rounded-md bg-[#EEF2FA] hover:bg-[#DCE3F0] text-[#0B1B48] text-xs font-semibold"
                >
                  Demo Seeker
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="max-w-md mx-auto bg-white rounded-lg border border-[#DCE3F0] p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-[#0B1B48]">Recover Portal Access</h2>
              <p className="text-xs text-[#5A6782] mt-1">Verify your email with a 6-digit OTP to set a new password.</p>
            </div>

            {resetStage === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                {authError && <p className="text-xs text-red-600">{authError}</p>}
                <button type="submit" disabled={authLoading} className="w-full py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
                  Send 6-Digit Recovery Code
                </button>
              </form>
            )}

            {resetStage === 'confirm' && (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                {sandboxOtp && (
                  <div className="p-3 rounded-md bg-[#EEF2FA] border border-[#1B3688]/20 text-xs">
                    Sandbox OTP Code: <strong className="font-mono">{sandboxOtp}</strong>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold mb-1">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                {authError && <p className="text-xs text-red-600">{authError}</p>}
                <button type="submit" disabled={authLoading} className="w-full py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
                  Update Password
                </button>
              </form>
            )}

            {resetStage === 'done' && (
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-bold">
                  Password updated successfully. You may now sign in.
                </div>
                <button type="button" onClick={() => setMode('login')} className="w-full py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
                  Back to Sign In
                </button>
              </div>
            )}

            <button type="button" onClick={() => setMode('login')} className="text-xs font-semibold text-[#1B3688] hover:underline">
              ← Back to Sign In
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
