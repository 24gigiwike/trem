import React, { createContext, useCallback, useContext, useState } from 'react';
import type { SubscriptionRecord, UserAccount, VendorProfile } from '../shared/types';
import {
  ensureOpenWorkspaceUser,
  getActiveSessionUser,
  getContextForUser,
  logoutLocal,
  type PublicAccountRole,
  registerLocal,
  signInLocal,
  toggleSavedLocal,
  updateProfileLocal,
} from '../lib/localStore';

interface AppContextValue {
  token: string | null;
  adminUser: UserAccount | null;
  user: UserAccount | null;
  vendorProfile: VendorProfile | null;
  subscription: SubscriptionRecord | null;
  unreadNotifications: number;
  savedIds: string[];
  loadingSession: boolean;
  signInOpen: (input: {
    email: string;
    role: PublicAccountRole;
    firstName?: string;
    lastName?: string;
    phone?: string;
    businessName?: string;
  }) => UserAccount;
  registerOpen: (input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: PublicAccountRole;
    businessName?: string;
    representativeRole?: string;
  }) => UserAccount;
  ensureOpenRole: (role: PublicAccountRole) => UserAccount;
  updateProfile: (patch: { firstName: string; lastName: string; phone: string }) => void;
  setAdminSession: (token: string, admin: UserAccount) => void;
  logoutAdmin: () => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  toggleSaved: (propertyId: string) => Promise<boolean>;
  apiFetch: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Admin bearer token kept strictly in React memory for /admin governance
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<UserAccount | null>(null);

  const initialState = getContextForUser(getActiveSessionUser());
  const [user, setUser] = useState<UserAccount | null>(initialState.user);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(initialState.vendorProfile);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(initialState.subscription);
  const [unreadNotifications, setUnreadNotifications] = useState(initialState.unreadNotifications);
  const [savedIds, setSavedIds] = useState<string[]>(initialState.savedIds);

  const syncFromUser = useCallback((nextUser: UserAccount | null) => {
    const ctx = getContextForUser(nextUser);
    setUser(ctx.user);
    setVendorProfile(ctx.vendorProfile);
    setSubscription(ctx.subscription);
    setUnreadNotifications(ctx.unreadNotifications);
    setSavedIds(ctx.savedIds);
  }, []);

  const refreshSession = useCallback(async () => {
    syncFromUser(getActiveSessionUser());
  }, [syncFromUser]);

  const signInOpen = useCallback(
    (input: {
      email: string;
      role: PublicAccountRole;
      firstName?: string;
      lastName?: string;
      phone?: string;
      businessName?: string;
    }) => {
      const nextUser = signInLocal(input);
      syncFromUser(nextUser);
      return nextUser;
    },
    [syncFromUser]
  );

  const registerOpen = useCallback(
    (input: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      role: PublicAccountRole;
      businessName?: string;
      representativeRole?: string;
    }) => {
      const nextUser = registerLocal(input);
      syncFromUser(nextUser);
      return nextUser;
    },
    [syncFromUser]
  );

  const ensureOpenRole = useCallback(
    (targetRole: PublicAccountRole) => {
      const nextUser = ensureOpenWorkspaceUser(targetRole);
      syncFromUser(nextUser);
      return nextUser;
    },
    [syncFromUser]
  );

  const updateProfile = useCallback(
    (patch: { firstName: string; lastName: string; phone: string }) => {
      const updated = updateProfileLocal(patch);
      syncFromUser(updated);
    },
    [syncFromUser]
  );

  const logout = useCallback(async () => {
    logoutLocal();
    syncFromUser(null);
  }, [syncFromUser]);

  const setAdminSession = useCallback((newToken: string, admin: UserAccount) => {
    setToken(newToken);
    setAdminUser(admin);
  }, []);

  const logoutAdmin = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Ignore errors during admin sign out
      }
    }
    setToken(null);
    setAdminUser(null);
  }, [token]);

  const toggleSaved = useCallback(
    async (propertyId: string): Promise<boolean> => {
      const activeUser = getActiveSessionUser();
      const nextIds = toggleSavedLocal(propertyId, activeUser);
      setSavedIds(nextIds);
      return true;
    },
    []
  );

  const apiFetch = useCallback(
    async <T = unknown>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
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

  return (
    <AppContext.Provider
      value={{
        token,
        adminUser,
        user,
        vendorProfile,
        subscription,
        unreadNotifications,
        savedIds,
        loadingSession: false,
        signInOpen,
        registerOpen,
        ensureOpenRole,
        updateProfile,
        setAdminSession,
        logoutAdmin,
        refreshSession,
        logout,
        toggleSaved,
        apiFetch,
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
