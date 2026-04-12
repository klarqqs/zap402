import React from "react";
import { ExternalLink } from "lucide-react";

import { contractSpecUrl, docsUrl, site } from "@/config/site";

const guides = [
  {
    title: "Read the product overview",
    subtitle: "How Zap402 fits together on Stellar.",
    href: docsUrl,
  },
  {
    title: "Contract behavior",
    subtitle: "Requests, escrow, and withdrawals in plain language.",
    href: contractSpecUrl,
  },
  {
    title: "Soroban docs",
    subtitle: "Official Stellar smart contract reference.",
    href: site.sorobanDocs,
  },
] as const;

/**
 * Ko-fi–style “Guides” list — helpful links (no new data dependencies).
 */
const HomeGuidesSection: React.FC = () => {
  return (
    <section className="kofi-dashboard-card p-6 shadow-none" aria-labelledby="guides-heading">
      <h2 id="guides-heading" className="font-body text-lg font-semibold text-zap-ink">
        Guides
      </h2>
      <p className="mt-1 font-body text-sm text-zap-ink-muted">
        Learn how requests, unlocks, and marketplace flows work.
      </p>
      <ul className="mt-5 divide-y divide-zap-border/80">
        {guides.map((g) => (
          <li key={g.href} className="py-3 first:pt-0">
            <a
              href={g.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 no-underline"
            >
              <ExternalLink
                className="mt-0.5 h-4 w-4 shrink-0 text-zap-ink-faint transition-colors group-hover:text-zap-teal"
                aria-hidden
              />
              <span>
                <span className="font-body text-[15px] font-semibold text-zap-ink transition-colors group-hover:text-zap-teal">
                  {g.title}
                </span>
                <span className="mt-0.5 block font-body text-sm text-zap-ink-muted">
                  {g.subtitle}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default HomeGuidesSection;
