import React from "react";
import { Link } from "react-router-dom";

import { getSiteOrigin, site } from "@/config/site";

export type RegisterIntroVariant = "register" | "profile";

interface RegisterScreenLayoutProps {
  children: React.ReactNode;
  introVariant?: RegisterIntroVariant;
  /** Override default hero title (e.g. wizard flow). */
  title?: string;
}

/**
 * Marketing + card shell for claim/register — matches landing hero (gradient, pills, card-editorial).
 */
const RegisterScreenLayout: React.FC<RegisterScreenLayoutProps> = ({
  children,
  introVariant = "register",
  title,
}) => {
  const origin = getSiteOrigin();

  return (
    <section className="hero-editorial-gradient editorial-section pb-24 pt-0 sm:pt-6">
      <div className="editorial-container">
        <div className="mx-auto max-w-2xl text-center sm:text-left">
          {/* <p className="text-label-caps text-label-caps--accent mt-6">// One transaction. Permanent on-chain identity.</p> */}
          {/* <h1 className="font-body mt-3 text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-tight tracking-[-0.04em] text-zap-ink">
            {title ?? "Create your page"}
          </h1> */}
          <p className="mt-5 max-w-xl text-pretty font-body text-[17px] leading-[1.6] text-zap-ink-muted md:text-lg">
            {introVariant === "profile" ? (
              <>
                One deploy on {site.name}. Supporters open{" "}
                <span className="font-mono text-sm font-medium text-zap-brand">
                  {origin}/@you
                </span>{" "}
                — tips settle on Stellar in seconds. Amounts show in USDC-style units.
              </>
            ) : (
              <>
              </>
            )}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <div className="card-editorial p-8 md:p-10">{children}</div>
          <div className="mt-10 flex justify-center">
            <Link
              to="/"
              className="text-sm font-medium text-zap-ink-muted underline decoration-zap-border decoration-1 underline-offset-4 transition-colors hover:text-zap-brand hover:decoration-zap-brand/50 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterScreenLayout;
