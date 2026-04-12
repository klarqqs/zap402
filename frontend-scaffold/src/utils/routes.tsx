import React, { Suspense } from 'react';
import PageTransition from "@/components/feedback/PageTransition";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageLoader from "@/components/feedback/PageLoader";

/**
 * Wraps a component with Suspense (PageLoader) and PageTransition.
 */
export const wrap = (element: React.ReactElement) => (
  <Suspense fallback={<PageLoader />}>
    <PageTransition>{element}</PageTransition>
  </Suspense>
);

/**
 * Wraps a component with ProtectedRoute and the default wrap (transitions + loading).
 */
export const protect = (element: React.ReactElement) => (
  <ProtectedRoute>{wrap(element)}</ProtectedRoute>
);
