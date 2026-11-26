import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Building2,
  PlusCircle,
  Megaphone,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  Settings,
  Bell,
  LogOut,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getNotificationsLocal, markAllNotificationsReadLocal } from '../lib/localStore';
import { TremLogo } from './TremLogo';
import type { NotificationItem } from '../shared/types';

export function PortalShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { user, vendorProfile, subscription, logout, unreadNotifications, refreshSession } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (showNotifs && user) {
      setNotifs(getNotificationsLocal(user.id));
    }
  }, [showNotifs, user]);

  const handleMarkRead = async () => {
    if (user) {
      markAllNotificationsReadLocal(user.id);
    }
    await refreshSession();
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/vendor/properties?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const navItems = [
    { to: '/vendor', end: true, label: 'Overview', icon: LayoutGrid },
    { to: '/vendor/properties', label: 'My Properties', icon: Building2 },
    { to: '/vendor/add', label: 'Add Property', icon: PlusCircle },
    { to: '/vendor/promote', label: 'Promote Listings', icon: Megaphone },
    { to: '/vendor/leads', label: 'Leads & Enquiries', icon: MessageSquare },
    { to: '/vendor/billing', label: 'Subscription & Billing', icon: CreditCard },
    {
      to: '/vendor/kyc',
      label: 'Verification & KYC',
      icon: ShieldCheck,
      badge: vendorProfile?.verificationStatus === 'verified' ? 'Verified' : vendorProfile?.verificationStatus === 'pending' ? 'Pending' : undefined,
    },
    { to: '/vendor/settings', label: vendorProfile?.entityType === 'agency' ? 'Agency Settings' : 'Vendor Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#F4F6FA] text-[#0B1B48] pb-16 lg:pb-0">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-[#DCE3F0] sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#DCE3F0]">
          <Link to="/">
            <TremLogo subtitle={vendorProfile?.entityType === 'agency' ? 'Agency Portal' : 'Vendor Portal'} />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#0B1B48] text-white font-semibold' : 'text-[#334155] hover:bg-[#EEF2FA] hover:text-[#0B1B48]'
                  }`
                }
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] shrink-0">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#DCE3F0]">
          {vendorProfile && (
            <Link
              to={`/agencies/${vendorProfile.slug}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] hover:bg-[#EEF2FA] text-xs font-semibold text-[#0B1B48] transition-colors"
            >
              <span className="truncate">View Public Microsite</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </Link>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#DCE3F0] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="lg:hidden">
              <TremLogo />
            </Link>
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-[#F4F6FA] border border-[#DCE3F0] rounded-md px-3 py-1.5 w-72">
              <Search className="w-4 h-4 text-[#5A6782] mr-2 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search properties, ref codes..."
                className="bg-transparent text-xs text-[#0B1B48] w-full focus:outline-none"
              />
            </form>
            {title && <span className="md:hidden font-display font-bold text-sm truncate">{title}</span>}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/vendor/billing"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs font-semibold text-[#0B1B48] whitespace-nowrap"
            >
              <span>
                {subscription
                  ? `${subscription.planCode === 'premium' ? 'Premium Agency' : 'Standard Plan'} · Active`
                  : 'No Active Plan'}
              </span>
            </Link>

            <Link
              to="/vendor/add"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Property</span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifs((v) => !v)}
                aria-label="Notifications"
                className="relative p-2 rounded-md border border-[#DCE3F0] hover:bg-[#F4F6FA]"
              >
                <Bell className="w-4 h-4 text-[#0B1B48]" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-4 h-4 rounded bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-[#DCE3F0] shadow-lg p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DCE3F0]">
                    <span className="font-display font-bold text-xs">Notifications</span>
                    <button type="button" onClick={handleMarkRead} className="text-[11px] font-semibold text-[#1B3688] hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#DCE3F0]">
                    {notifs.length === 0 ? (
                      <p className="py-4 text-xs text-[#5A6782] text-center">No notifications yet.</p>
                    ) : (
                      notifs.map((n) => (
                        <Link
                          key={n.id}
                          to={n.link}
                          onClick={() => setShowNotifs(false)}
                          className={`block py-2.5 px-1 hover:bg-[#F4F6FA] ${!n.isRead ? 'bg-[#EEF2FA]/60' : ''}`}
                        >
                          <p className="text-xs font-bold text-[#0B1B48]">{n.title}</p>
                          <p className="text-[11px] text-[#5A6782] mt-0.5">{n.body}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              title="Sign Out"
              className="p-2 rounded-md border border-[#DCE3F0] text-[#5A6782] hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full mx-auto">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DCE3F0] grid grid-cols-5 h-14 text-[11px] font-medium text-[#5A6782]">
        <NavLink to="/vendor" end className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <LayoutGrid className="w-4 h-4" />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/vendor/properties" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <Building2 className="w-4 h-4" />
          <span>Properties</span>
        </NavLink>
        <NavLink to="/vendor/add" className="flex flex-col items-center justify-center gap-0.5 text-[#0B1B48] font-bold">
          <PlusCircle className="w-5 h-5 text-[#1B3688]" />
          <span>Add</span>
        </NavLink>
        <NavLink to="/vendor/promote" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <Megaphone className="w-4 h-4" />
          <span>Promote</span>
        </NavLink>
        <NavLink to="/vendor/leads" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 ${isActive ? 'text-[#0B1B48] font-bold' : ''}`}>
          <MessageSquare className="w-4 h-4" />
          <span>Leads</span>
        </NavLink>
      </nav>
    </div>
  );
}
