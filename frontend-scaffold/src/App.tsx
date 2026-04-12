import React from 'react';
import { BrowserRouter, useLocation, useRoutes } from 'react-router-dom';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ContractConfigBanner from "@/components/feedback/ContractConfigBanner";
import { WalletConnectModalProvider } from "@/components/wallet/WalletConnectModal";
import ProfileStoreSync from "@/components/wallet/ProfileStoreSync";
import ScrollToTop from "@/components/feedback/ScrollToTop";
import ErrorBoundary from "@/components/feedback/ErrorBoundary";
import ToastContainer from "@/components/feedback/ToastContainer";
import { useWallet } from "@/hooks/useWallet";
import { useProfileStore } from "@/state/profileStore";
import { isPublicZapPath } from "@/utils/dashboardRouteGuards";
import { routes } from '@/routes';

const AppContent: React.FC = () => {
  const routeElements = useRoutes(routes);
  const { pathname } = useLocation();
  const { connected } = useWallet();
  const isRegistered = useProfileStore((s) => s.isRegistered);
  /** Dashboard shell (sidebar): terminal, network, profile routes, and any public creator page when registered + connected. */
  const usesDashboardShell =
    pathname.startsWith("/terminal") ||
    pathname === "/network" ||
    pathname === "/profile/edit" ||
    pathname === "/profile/purchases" ||
    (isRegistered && connected && isPublicZapPath(pathname));
  /** Dedicated register / onboarding — no global nav (matches full-bleed wizard layout). */
  const hideMarketingHeader =
    pathname === "/register" ||
    usesDashboardShell;
  const showMarketingFooter = !usesDashboardShell;

  return (
    <>
      <ScrollToTop />
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-zap-bg text-zap-ink">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:border focus:border-zap-bg-alt-bright focus:bg-zap-brand focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-none focus:outline-none focus:ring-2 focus:ring-zap-accent"
          >
            Skip to content
          </a>
          {!hideMarketingHeader ? <Header /> : null}
          <ProfileStoreSync />
          <ContractConfigBanner />
          <div className="flex-1">
            {routeElements}
          </div>
          {showMarketingFooter ? <Footer /> : null}
        </div>
      </ErrorBoundary>
      <ToastContainer />
    </>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <WalletConnectModalProvider>
      <AppContent />
    </WalletConnectModalProvider>
  </BrowserRouter>
);

export default App;
