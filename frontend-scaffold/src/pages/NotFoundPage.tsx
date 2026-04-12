import React from "react";
import { Link } from "react-router-dom";

import PageContainer from "@/components/layout/PageContainer";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFoundPage: React.FC = () => {
  usePageTitle("Page not found");

  return (
    <PageContainer maxWidth="md" className="py-16 md:py-24">
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-zap-brand">
          404
        </p>
        <h1 className="font-body mt-4 text-[clamp(4rem,14vw,7.5rem)] font-bold leading-none tracking-tight text-zap-ink">
          Page not found
        </h1>
        <p className="mt-6 max-w-md font-body text-base leading-relaxed text-zap-ink-muted">
          Route not registered. Try HOME or NETWORK.
        </p>

        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
          <Link to="/" className="btn-primary inline-flex justify-center text-center no-underline">
            HOME
          </Link>
          <Link
            to="/network"
            className="btn-ghost inline-flex justify-center text-center no-underline"
          >
            OPEN NETWORK
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default NotFoundPage;
