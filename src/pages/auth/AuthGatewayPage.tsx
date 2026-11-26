import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, KeyRound, Search, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { UserAccount } from '../../shared/types';
import type { PublicAccountRole } from '../../lib/localStore';
import { TremLogo } from '../../components/TremLogo';

export function AuthGatewayPage() {
  const [searchParams] = useSearchParams();
  const rawRole = searchParams.get('role');
  const initialRole: PublicAccountRole =
    rawRole === 'seeker' || rawRole === 'vendor' || rawRole === 'agency' ? rawRole : 'agency';
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'select';

  const [mode, setMode] = useState<'select' | 'login'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<PublicAccountRole>(initialRole);

  const { signInOpen } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [passwordVisual, setPasswordVisual] = useState('');
  const [authError, setAuthError] = useState('');

  const nextUrl = searchParams.get('next');

  const routeAfterAccess = (user: UserAccount) => {
    if (nextUrl && nextUrl.startsWith('/')) {
      navigate(nextUrl);
      return;
    }
    if (user.role === 'seeker') navigate('/seeker');
    else navigate('/vendor');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setAuthError('');
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || undefined;
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

    // Establish local session without transmitting or storing any password
    setPasswordVisual('');
    const localUser = signInOpen({
      email: trimmedEmail,
      role: selectedRole,
      firstName,
      lastName,
    });
    routeAfterAccess(localUser);
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
            <span>Open Access Marketplace Portal</span>
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
              The Real Estate Marketplace. Choose your account category or enter your Seeker, Vendor, or Agency workspace directly.
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
                mode === 'login' ? 'bg-[#E8C547] text-[#0B1B48]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Log In to Workspace
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 py-8">
        {mode === 'select' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">Account Category</span>
                <h2 className="font-display font-extrabold text-2xl text-[#0B1B48]">Choose Your Account Category</h2>
                <p className="text-xs text-[#5A6782] mt-0.5">Select the profile type that matches your marketplace role.</p>
              </div>
              <span className="px-3 py-1.5 rounded-md bg-white border border-[#DCE3F0] text-[#1B3688] text-xs font-bold">
                Immediate Workspace Onboarding
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
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Full property directory access</span></div>
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
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" /><span>Individual Vendor listing & promotion tools</span></div>
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
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#E8C547] shrink-0" /><span>SCUML & CAC compliance portfolio</span></div>
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
                  Already have a profile? Sign In
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
              <p className="text-xs text-[#5A6782] mt-1">
                Enter your details and choose your workspace category for immediate portal access.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Account Category</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as PublicAccountRole)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm font-semibold text-[#0B1B48]"
                >
                  <option value="seeker">Property Seeker & Buyer</option>
                  <option value="vendor">Independent Vendor & Landlord</option>
                  <option value="agency">Real Estate Agency & Brokerage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Email Address *</label>
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
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Babatunde Adeleke"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B48] mb-1">Passphrase (Optional)</label>
                <input
                  type="password"
                  value={passwordVisual}
                  onChange={(e) => setPasswordVisual(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                />
              </div>

              {authError && <p className="text-xs font-semibold text-red-600">{authError}</p>}

              <button
                type="submit"
                className="w-full py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold"
              >
                Enter {selectedRole === 'seeker' ? 'Seeker Dashboard' : selectedRole === 'vendor' ? 'Vendor Workspace' : 'Agency Workspace'}
              </button>
            </form>

            <div className="pt-4 border-t border-[#DCE3F0] flex items-center justify-between text-xs">
              <span className="text-[#5A6782]">Need a full profile setup?</span>
              <Link to={`/auth/register?role=${selectedRole}`} className="font-bold text-[#1B3688] hover:underline">
                Register Profile →
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
