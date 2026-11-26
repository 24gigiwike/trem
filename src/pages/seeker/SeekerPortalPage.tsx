import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, CheckCircle2, Compass, LogOut, MessageSquare, Search, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { EnquiryRecord, PropertyListing } from '../../shared/types';
import { PropertyCard } from '../../components/PropertyCard';

export function SeekerPortalPage() {
  const { user, apiFetch, logout, refreshSession } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'overview' | 'saved' | 'enquiries' | 'profile'>('overview');
  const [savedProps, setSavedProps] = useState<PropertyListing[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);

    setLoading(true);
    Promise.all([
      apiFetch<{ saved: PropertyListing[] }>('/api/seeker/saved'),
      apiFetch<{ enquiries: EnquiryRecord[] }>('/api/seeker/enquiries'),
    ])
      .then(([sRes, eRes]) => {
        setSavedProps(sRes.saved);
        setEnquiries(eRes.enquiries);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, apiFetch]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName, lastName, phone }),
    });
    await refreshSession();
    setProfileMsg('Profile details updated.');
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display font-bold text-2xl text-[#0B1B48]">Sign in to access your Seeker Dashboard</h1>
        <p className="text-sm text-[#5A6782]">View saved properties, track inspection slots, and manage enquiries.</p>
        <Link to="/auth?mode=login" className="inline-block px-6 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
          Sign In / Create Seeker Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-[#071336] text-white rounded-lg p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#1B3688]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8C547]">Property Seeker & Buyer Portal</span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-1">
            Welcome, {user.firstName} {user.lastName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">{user.email} · {user.phone}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/explore" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#E8C547] text-[#0B1B48] text-xs font-bold">
            <Search className="w-4 h-4" />
            <span>Explore Properties</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'overview', label: 'Overview', icon: Compass },
          { key: 'saved', label: `Saved Properties (${savedProps.length})`, icon: Bookmark },
          { key: 'enquiries', label: `Enquiries & Inspections (${enquiries.length})`, icon: MessageSquare },
          { key: 'profile', label: 'Profile Settings', icon: User },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as typeof tab)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold border transition-colors ${
                tab === t.key ? 'bg-[#0B1B48] text-white border-[#0B1B48]' : 'bg-white text-[#334155] border-[#DCE3F0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-[#DCE3F0] p-5">
              <div className="text-xs font-bold text-[#5A6782]">Saved Watchlist</div>
              <div className="font-display font-extrabold text-3xl text-[#0B1B48] mt-1 tabular-nums">{savedProps.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-[#DCE3F0] p-5">
              <div className="text-xs font-bold text-[#5A6782]">Submitted Enquiries</div>
              <div className="font-display font-extrabold text-3xl text-[#0B1B48] mt-1 tabular-nums">{enquiries.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-[#DCE3F0] p-5">
              <div className="text-xs font-bold text-[#5A6782]">Discovery Shortcuts</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Link to="/explore?category=residential" className="px-2.5 py-1 rounded bg-[#EEF2FA] text-[#1B3688] text-xs font-bold">Residential</Link>
                <Link to="/explore?category=land_banking" className="px-2.5 py-1 rounded bg-[#EEF2FA] text-[#1B3688] text-xs font-bold">Land Banking</Link>
                <Link to="/explore?category=buy_build" className="px-2.5 py-1 rounded bg-[#EEF2FA] text-[#1B3688] text-xs font-bold">Buy & Build</Link>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-[#0B1B48]">Recently Saved Assets</h2>
              <button type="button" onClick={() => setTab('saved')} className="text-xs font-bold text-[#1B3688] hover:underline">
                View All →
              </button>
            </div>
            {loading ? (
              <div className="h-64 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
            ) : savedProps.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#DCE3F0] p-8 text-center text-sm text-[#5A6782]">
                No saved properties yet. Browse verified listings and bookmark your favorites.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {savedProps.slice(0, 3).map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'saved' && (
        <div>
          {savedProps.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#DCE3F0] p-12 text-center space-y-3">
              <h3 className="font-display font-bold text-lg">Your Saved Watchlist is Empty</h3>
              <p className="text-xs text-[#5A6782]">Bookmark properties while exploring to compare valuations and titles here.</p>
              <Link to="/explore" className="inline-block px-5 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
                Explore Properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {savedProps.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'enquiries' && (
        <div className="bg-white rounded-lg border border-[#DCE3F0] overflow-hidden">
          {enquiries.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5A6782]">No enquiries or inspections submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6FA] border-b border-[#DCE3F0] text-[#5A6782] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Property / Ref</th>
                    <th className="py-3 px-4">Agency / Vendor</th>
                    <th className="py-3 px-4">Type & Schedule</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3F0]">
                  {enquiries.map((e) => (
                    <tr key={e.id} className="hover:bg-[#F4F6FA]/60">
                      <td className="py-3 px-4 font-semibold text-[#0B1B48]">
                        {e.propertyRef ? (
                          <Link to={`/properties/${e.propertyRef}`} className="hover:underline">
                            {e.propertyRef} — {e.propertyTitle}
                          </Link>
                        ) : (
                          e.propertyTitle
                        )}
                      </td>
                      <td className="py-3 px-4">{e.vendorName}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold">{e.enquiryType}</span>
                        {e.inspectionDate && (
                          <span className="block text-[11px] text-[#5A6782]">
                            {e.inspectionDate} · {e.inspectionSession} ({e.tourPreference})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688] font-bold uppercase text-[10px]">
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#5A6782] tabular-nums">{new Date(e.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <form onSubmit={handleProfileSave} className="max-w-lg bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0B1B48]">Seeker Profile Settings</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Phone / WhatsApp</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
            />
          </div>
          {profileMsg && (
            <div className="p-2.5 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{profileMsg}</span>
            </div>
          )}
          <button type="submit" className="px-5 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
            Save Profile Changes
          </button>
        </form>
      )}
    </div>
  );
}
