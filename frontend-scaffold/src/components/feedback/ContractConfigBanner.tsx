import React from "react";

import { env } from "@/config/env";
import { CONTRACT_ENV_FILE_HINT } from "@/config/contractSetup";
import { docsUrl } from "@/config/site";

/**
 * Shown when `VITE_CONTRACT_ID` is missing — the app cannot call Soroban until it is set.
 */
const ContractConfigBanner: React.FC = () => {
  if (env.contractConfigured) return null;

  return (
    <div>
   
    </div>
  );
};

export default ContractConfigBanner;
