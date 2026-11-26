import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SubscriptionRecord, UserAccount, VendorProfile } from '../shared/types';

interface AppContextValue {
  token: string | null;
  user: UserAccount | null;
  vendorProfile: VendorProfile | null;
  subscription: SubscriptionRecord | null;
  unreadNotifications: number;
  savedIds: string[];
  loadingSession: boolean;
  setAuthSession: (token: string, user: UserAccount) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  toggleSaved: (propertyId: string) => Promise<boolean>;
  apiFetch: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Token kept strictly in React memory (never persisted in localStorage/sessionStorage)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);

  const apiFetch = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}, overrideToken?: string | null): Promise<T> => {
      const activeToken = overrideToken !== undefined ? overrideToken : token;
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
      }
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data as T;
    },
    [token]
  );

  const loadAccountContext = useCallback(
    async (activeToken: string) => {
      setLoadingSession(true);
      try {
        const me = await apiFetch<{
          user: UserAccount;
          vendorProfile: VendorProfile | null;
          subscription: SubscriptionRecord | null;
          unreadNotifications: number;
        }>('/api/auth/me', {}, activeToken);
        setUser(me.user);
        setVendorProfile(me.vendorProfile);
        setSubscription(me.subscription);
        setUnreadNotifications(me.unreadNotifications || 0);

        const savedRes = await apiFetch<{ saved: Array<{ id: string }> }>('/api/seeker/saved', {}, activeToken);
        setSavedIds(savedRes.saved.map((p) => p.id));
      } catch {
        setToken(null);
        setUser(null);
        setVendorProfile(null);
        setSubscription(null);
        setSavedIds([]);
      } finally {
        setLoadingSession(false);
      }
    },
    [apiFetch]
  );

  const setAuthSession = useCallback(
    async (newToken: string, initialUser: UserAccount) => {
      setToken(newToken);
      setUser(initialUser);
      await loadAccountContext(newToken);
    },
    [loadAccountContext]
  );

  const refreshSession = useCallback(async () => {
    if (!token) return;
    await loadAccountContext(token);
  }, [token, loadAccountContext]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore errors during logout cleanup
      }
    }
    setToken(null);
    setUser(null);
    setVendorProfile(null);
    setSubscription(null);
    setSavedIds([]);
    setUnreadNotifications(0);
  }, [token, apiFetch]);

  const toggleSaved = useCallback(
    async (propertyId: string): Promise<boolean> => {
      if (!token) {
        return false;
      }
      const res = await apiFetch<{ saved: boolean }>(`/api/seeker/saved/${propertyId}`, { method: 'POST' });
      setSavedIds((prev) => (res.saved ? Array.from(new Set([...prev, propertyId])) : prev.filter((id) => id !== propertyId)));
      return true;
    },
    [token, apiFetch]
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setVendorProfile(null);
      setSubscription(null);
    }
  }, [token]);

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        vendorProfile,
        subscription,
        unreadNotifications,
        savedIds,
        loadingSession,
        setAuthSession,
        refreshSession,
        logout,
        toggleSaved,
        apiFetch: (url, options) => apiFetch(url, options),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
