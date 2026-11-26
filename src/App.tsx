import React, { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PublicShell } from './components/PublicShell';
import { HomePage } from './pages/public/HomePage';
import { ExplorePage } from './pages/public/ExplorePage';
import { PropertyDetailPage } from './pages/public/PropertyDetailPage';
import { AgenciesDirectoryPage, AgencyMicrositePage } from './pages/public/AgencyMicrositePage';
import { HowItWorksPage, LegalTrustPage, PricingPage } from './pages/public/InfoPages';
import { AuthGatewayPage } from './pages/auth/AuthGatewayPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SeekerPortalPage } from './pages/seeker/SeekerPortalPage';
import { VendorOverviewPage } from './pages/vendor/VendorOverviewPage';
import { VendorPropertiesPage } from './pages/vendor/VendorPropertiesPage';
import { AddPropertyWizardPage } from './pages/vendor/AddPropertyWizardPage';
import { VendorOnboardingPage } from './pages/vendor/VendorOnboardingPage';
import { VendorPromotionPage } from './pages/vendor/VendorPromotionPage';
import {
  VendorBillingPage,
  VendorKycPage,
  VendorLeadsPage,
  VendorSettingsPage,
} from './pages/vendor/VendorOperationsPages';
import { AdminConsolePage } from './pages/admin/AdminConsolePage';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loadingSession } = useApp();
  if (loadingSession) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-16">
        <div className="h-48 rounded-2xl bg-white border border-[#DCE3F0] animate-pulse" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  return <>{children}</>;
}

function RequireVendor({ children }: { children: React.ReactNode }) {
  const { user, loadingSession } = useApp();
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-6">
        <div className="w-full max-w-md h-40 rounded-2xl bg-white border border-[#DCE3F0] animate-pulse" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  if (user.role !== 'vendor' && user.role !== 'agency') {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/seeker" replace />;
  }
  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <div className="max-w-[720px] mx-auto px-4 py-20 text-center space-y-4">
      <span className="text-xs font-bold uppercase tracking-wider text-[#1B3688]">404 · Route Unavailable</span>
      <h1 className="font-display font-extrabold text-3xl text-[#0B1B48]">Page Not Found</h1>
      <p className="text-sm text-[#5A6782]">
        The requested marketplace page or asset reference could not be located.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-[#0B1B48] text-white text-xs font-bold">
          Return Home
        </Link>
        <Link to="/explore" className="px-5 py-2.5 rounded-xl bg-[#E8C547] text-[#0B1B48] text-xs font-bold">
          Explore Properties
        </Link>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollManager />
      <Routes>
        {/* Public & Seeker Routes inside PublicShell */}
        <Route
          path="/"
          element={
            <PublicShell>
              <HomePage />
            </PublicShell>
          }
        />
        <Route
          path="/explore"
          element={
            <PublicShell>
              <ExplorePage />
            </PublicShell>
          }
        />
        <Route
          path="/properties/:idOrRef"
          element={
            <PublicShell>
              <PropertyDetailPage />
            </PublicShell>
          }
        />
        <Route
          path="/agencies"
          element={
            <PublicShell>
              <AgenciesDirectoryPage />
            </PublicShell>
          }
        />
        <Route
          path="/agencies/:slug"
          element={
            <PublicShell>
              <AgencyMicrositePage />
            </PublicShell>
          }
        />
        <Route
          path="/pricing"
          element={
            <PublicShell>
              <PricingPage />
            </PublicShell>
          }
        />
        <Route
          path="/how-it-works"
          element={
            <PublicShell>
              <HowItWorksPage />
            </PublicShell>
          }
        />
        <Route
          path="/legal"
          element={
            <PublicShell>
              <LegalTrustPage />
            </PublicShell>
          }
        />
        <Route
          path="/seeker"
          element={
            <PublicShell>
              <RequireAuth>
                <SeekerPortalPage />
              </RequireAuth>
            </PublicShell>
          }
        />

        {/* Authentication & Onboarding Gateway */}
        <Route path="/auth" element={<AuthGatewayPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* Vendor & Agency Workspace */}
        <Route
          path="/vendor"
          element={
            <RequireVendor>
              <VendorOverviewPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/properties"
          element={
            <RequireVendor>
              <VendorPropertiesPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/add"
          element={
            <RequireVendor>
              <AddPropertyWizardPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/promote"
          element={
            <RequireVendor>
              <VendorPromotionPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/leads"
          element={
            <RequireVendor>
              <VendorLeadsPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/billing"
          element={
            <RequireVendor>
              <VendorBillingPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/kyc"
          element={
            <RequireVendor>
              <VendorKycPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/settings"
          element={
            <RequireVendor>
              <VendorSettingsPage />
            </RequireVendor>
          }
        />
        <Route
          path="/vendor/onboarding"
          element={
            <RequireVendor>
              <VendorOnboardingPage />
            </RequireVendor>
          }
        />

        {/* Platform Administration Console */}
        <Route path="/admin" element={<AdminConsolePage />} />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <PublicShell>
              <NotFoundPage />
            </PublicShell>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
