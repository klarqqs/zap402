import React from "react";
import { Link } from "react-router-dom";

import PageContainer from "@/components/layout/PageContainer";
import Button from "@/components/primitives/Button";

interface CreatorNotFoundProps {
  username?: string;
}

/**
 * Matches `ErrorState` editorial shell: dashed surface, ⚡, zap typography, solid `editorial` CTA.
 */
const CreatorNotFound: React.FC<CreatorNotFoundProps> = ({ username }) => {
  const handle = username ?? "unknown";

  return (
    <PageContainer maxWidth="md" className="bg-transparent py-10 sm:py-16">
      <div className="flex justify-center px-4">
        <div
          className="mx-auto w-full max-w-[480px] px-8 py-12 text-center md:px-12 md:py-14"
          role="alert"
        >
          <p className="text-4xl leading-none opacity-90" aria-hidden>
            ⚡
          </p>

          <p className="mx-auto mt-5 max-w-md text-pretty font-body text-[13px] leading-[1.85] text-zap-ink-muted">
            We could not find @{handle}. Check the handle in the URL and try again, or browse
            agents on the network.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default CreatorNotFound;
