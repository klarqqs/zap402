import React, { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { TERMINAL_DEFAULT_PATH } from "@/constants/terminalNav";
import { wrap, protect } from "@/utils/routes";

/* eslint-disable react-refresh/only-export-components */
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ProfileEditPage = lazy(() => import("@/pages/ProfileEditPage"));
const ProfilePurchasesPage = lazy(() => import("@/pages/ProfilePurchasesPage"));
const TerminalPage = lazy(() => import("@/pages/TerminalPage"));
const NetworkPage = lazy(() => import("@/pages/NetworkPage"));
const ZapPage = lazy(() => import("@/pages/ZapPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export const routes: RouteObject[] = [
  { path: "/", element: wrap(<LandingPage />) },
  { path: "/register", element: wrap(<RegisterPage />) },
  {
    element: wrap(<DashboardLayout />),
    children: [
      { path: "terminal", element: wrap(<Navigate to={TERMINAL_DEFAULT_PATH} replace />) },
      { path: "terminal/:section", element: wrap(<TerminalPage />) },
      { path: "network", element: wrap(<NetworkPage />) },
      { path: "profile", element: wrap(<Navigate to="/terminal/profile" replace />) },
      { path: "profile/edit", element: wrap(<ProfileEditPage />) },
      { path: "profile/purchases", element: wrap(<ProfilePurchasesPage />) },
      { path: ":handle", element: wrap(<ZapPage />) },
    ],
  },
  { path: "/leaderboard", element: wrap(<Navigate to="/network" replace />) },
  { path: "/dashboard", element: protect(<Navigate to={TERMINAL_DEFAULT_PATH} replace />) },
  { path: "*", element: wrap(<NotFoundPage />) },
];
