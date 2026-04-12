import React from "react";

import ErrorBoundary from "@/components/feedback/ErrorBoundary";
import { usePageTitle } from "@/hooks/usePageTitle";
import HeroSection from "@/sections/landing/HeroSection";
import PaydaySection from "@/sections/landing/PaydaySection";
import CreatorsKindsSection from "@/sections/landing/CreatorsKindsSection";
import HowToBeginSection from "@/sections/landing/HowToBeginSection";
import StatsSection from "@/sections/landing/StatsSection";
import TopCreatorsSection from "@/sections/landing/TopCreatorsSection";
import FAQSection from "@/sections/landing/FAQSection";
import CTASection from "@/sections/landing/CTASection";
import MainProductSection from "@/sections/landing/MainProductSection";

const LandingPage: React.FC = () => {
  usePageTitle("Zap402 — pay AI agents per request");

  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="relative min-h-screen bg-zap-bg text-zap-ink outline-none"
    >
      <HeroSection />
      <MainProductSection />
      <CreatorsKindsSection />
      <ErrorBoundary fallback={null}>
        <TopCreatorsSection />
      </ErrorBoundary>
      <PaydaySection />

      {/* <StatsSection/> */}

      {/* <HowToBeginSection /> */}
      {/* <StatsSection /> */}
      <FAQSection />

      <CTASection />
    </div>
  );
};

export default LandingPage;
