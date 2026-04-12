import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Purchases live under Settings; this route keeps old bookmarks working.
 */
const ProfilePurchasesPage: React.FC = () => (
  <Navigate to="/terminal/history" replace />
);

export default ProfilePurchasesPage;
