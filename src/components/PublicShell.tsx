import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Home, PlusCircle, LayoutDashboard, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeNewsletterLocal } from '../lib/localStore';
import { TremLogo } from './TremLogo';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const { user, savedIds } = useApp();
  const navigate = useNavigate();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  const portalPath = !user
    ? '/auth'
    : user.role === 'seeker'
    ? '/seeker'
    : '/vendor';

  const handleEnlistClick = () => {
    navigate('/vendor/add');
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('loading');
    subscribeNewsletterLocal(newsletterEmail);
    try {
      await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
    } catch {
      // Local store already persisted subscription cleanly
    }
    setNewsletterStatus('done');
    setNewsletterMsg('Subscribed to verified property drops.');
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA] text-[#0B1B48] pb-16 md:pb-0">
      <header className="sticky top-0 z-40 bg-[#071336] text-white border-b border-white/10">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0">
            <TremLogo dark />
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200">
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 transition-colors hover:text-[#E8C547] ${isActive ? 'text-[#E8C547] font-semibold' : ''}`
              }
            >
              Explore
            </NavLink>
            <Link to="/explore?category=commercial" className="whitespace-nowrap shrink-0 transition-colors hover:text-[#E8C547]">
              Commercial
            </Link>
            <Link to="/explore?category=residential" className="whitespace-nowrap shrink-0 transition-colors hover:text-[#E8C547]">
              Residential
            </Link>
            <Link to="/explore?category=land_banking" className="whitespace-nowrap shrink-0 transition-colors hover:text-[#E8C547]">
              Land Banking
            </Link>
            <Link to="/agencies" className="whitespace-nowrap shrink-0 transition-colors hover:text-[#E8C547]">
              Agencies
            </Link>
            <Link to="/how-it-works" className="whitespace-nowrap shrink-0 transition-colors hover:text-[#E8C547]">
              How It Works
            </Link>
            <Link to="/pricing" className="whitespace-nowrap shrink-0 transition-colors hover:text-[#E8C547]">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/seeker"
              aria-label="Saved properties"
              className="relative p-2 rounded-md border border-white/15 bg-[#0B1B48] hover:bg-white/10 transition-colors hidden sm:inline-flex"
            >
              <Bookmark className="w-4 h-4 text-white" />
              {savedIds.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-[10px] font-bold leading-none tabular-nums">
                  {savedIds.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleEnlistClick}
              className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              Enlist Property
            </button>

            <Link
              to={portalPath}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 text-[#E8C547]" />
              <span>{user ? `${user.firstName} Portal` : 'Sign In'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#071336] text-white mt-16">
        <div className="border-b border-white/10 bg-[#0B1B48]">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E8C547]">Property Market Dispatch</p>
              <h3 className="font-display font-bold text-xl text-white mt-1">
                Receive verified property drops and new listings across Nigeria
              </h3>
            </div>
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto lg:min-w-[420px]">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your business or personal email"
                className="flex-1 px-4 py-2.5 rounded-md bg-white text-[#0B1B48] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E8C547]"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="px-5 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors"
              >
                {newsletterStatus === 'loading' ? 'Joining...' : 'Subscribe'}
              </button>
            </form>
          </div>
          {newsletterMsg && (
            <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pb-4 text-xs text-[#E8C547] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{newsletterMsg}</span>
            </div>
          )}
        </div>

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 text-sm">
          <div className="lg:col-span-1 space-y-3">
            <TremLogo dark />
            <p className="text-xs text-slate-300 leading-relaxed">
              Nigeria&apos;s verified real estate marketplace connecting property seekers, independent vendors, and CAC/SCUML-accredited agencies across 36 states and FCT Abuja.
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8C547]">
              <ShieldCheck className="w-4 h-4" />
              <span>CAC & SCUML Verified Platform</span>
            </div>
            <p className="text-xs text-slate-400">info@therealestatemarketplace.com</p>
          </div>

          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#E8C547] mb-3">Categories</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/explore?category=residential" className="hover:text-white">Residential Buildings</Link></li>
              <li><Link to="/explore?category=commercial" className="hover:text-white">Commercial Buildings</Link></li>
              <li><Link to="/explore?category=land_banking" className="hover:text-white">Land Banking</Link></li>
              <li><Link to="/explore?category=buy_build" className="hover:text-white">Buy and Build</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#E8C547] mb-3">For Vendors & Agencies</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/auth?role=agency" className="hover:text-white">Enlist Property</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Standard & Premium Plans</Link></li>
              <li><Link to="/vendor/kyc" className="hover:text-white">Verification Requirements</Link></li>
              <li><Link to="/vendor/promote" className="hover:text-white">Promotion Packages</Link></li>
              <li><Link to="/vendor" className="hover:text-white">Vendor Workspace</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#E8C547] mb-3">Property Seekers</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/explore" className="hover:text-white">Search Listings</Link></li>
              <li><Link to="/agencies" className="hover:text-white">Verified Agencies</Link></li>
              <li><Link to="/seeker" className="hover:text-white">Saved Properties</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white">Buyer Protection</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#E8C547] mb-3">Legal & Governance</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><Link to="/legal#terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/legal#privacy" className="hover:text-white">Privacy & NDPR Policy</Link></li>
              <li><Link to="/legal#cac" className="hover:text-white">CAC & SCUML Verification</Link></li>
              <li><Link to="/legal#faq" className="hover:text-white">Marketplace FAQs</Link></li>
              <li><Link to="/admin" className="hover:text-[#E8C547]">Admin Console</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>Copyright © {new Date().getFullYear()} The Real Estate Marketplace (TREM). All rights reserved.</span>
            <span>Owerri, Imo State & Lagos, Nigeria</span>
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DCE3F0] grid grid-cols-5 h-14 text-[11px] font-medium text-[#5A6782]">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <Compass className="w-4 h-4" />
          <span>Explore</span>
        </NavLink>
        <button type="button" onClick={handleEnlistClick} className="flex flex-col items-center justify-center gap-0.5 text-[#0B1B48] font-bold">
          <PlusCircle className="w-5 h-5 text-[#1B3688]" />
          <span>Enlist</span>
        </button>
        <NavLink to={portalPath} className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Workspace</span>
        </NavLink>
        <NavLink to="/seeker" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <User className="w-4 h-4" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
