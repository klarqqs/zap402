import React from 'react';
import Loader from '@/components/primitives/Loader';

/**
 * Centered loader for initially fetching lazy-loaded pages (Suspense fallback).
 */
const PageLoader: React.FC = () => (
  <div
    className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-2 bg-[var(--dashboard-canvas)] px-4 py-16"
    role="status"
    aria-live="polite"
    aria-label="Loading page"
  >
    <Loader size="lg" text="Loading…" />
  </div>
);

export default PageLoader;
