import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";

import ErrorBoundary from "@/components/feedback/ErrorBoundary";
import Loader from "@/components/primitives/Loader";
import RegisterWizard from "@/sections/profile/RegisterWizard";
import RegisterScreenLayout from "@/sections/profile/RegisterScreenLayout";
import { TERMINAL_DEFAULT_PATH } from "@/constants/terminalNav";
import { useInteractionHistoryStore } from "@/state/interactionHistoryStore";
import { useProfileStore } from "@/state/profileStore";

const RegisterPage: React.FC = () => {
  const loading = useProfileStore((s) => s.loading);
  const isRegistered = useProfileStore((s) => s.isRegistered);
  const setActiveJourneyId = useInteractionHistoryStore((s) => s.setActiveJourneyId);

  useEffect(() => {
    if (isRegistered) setActiveJourneyId(null);
  }, [isRegistered, setActiveJourneyId]);

  if (isRegistered) {
    return <Navigate to={TERMINAL_DEFAULT_PATH} replace />;
  }

  if (loading) {
    return (
      <ErrorBoundary errorStateVariant="editorial">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-h-screen items-center justify-center bg-zap-bg text-zap-ink focus:outline-none"
        >
          <Loader size="lg" text="Loading your profile…" />
        </main>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary errorStateVariant="editorial">
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-zap-bg text-zap-ink focus:outline-none"
      >
        <RegisterScreenLayout introVariant="register" title="Let's get you started">
          <RegisterWizard />
        </RegisterScreenLayout>
      </main>
    </ErrorBoundary>
  );
};

export default RegisterPage;
