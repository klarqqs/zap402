import React from "react";
import { NavLink, useLocation } from "react-router-dom";

import { TERMINAL_NAV } from "@/constants/terminalNav";

/**
 * Bottom tab bar — mirrors terminal routes; scrolls horizontally when many items (md+ uses sidebar).
 */
const DashboardMobileNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--card-border-soft)] bg-zap-bg-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Workspace"
    >
      <div className="flex h-14 max-w-[100vw] items-stretch gap-0 overflow-x-auto overscroll-x-contain px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TERMINAL_NAV.map((item) => {
          const to = `/terminal/${item.slug}`;
          const active = pathname === to || pathname.startsWith(`${to}/`);
          const Icon = item.icon;
          const label = item.shortLabel ?? item.label;
          if (item.comingSoon) {
            return (
              <NavLink
                key={item.slug}
                to={to}
                className={`flex min-h-[44px] min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 py-1 font-body text-[9px] font-semibold leading-tight tracking-tight ${
                  active ? "text-zap-teal" : "text-zap-ink-muted"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} className="shrink-0 opacity-90" aria-hidden />
                <span className="max-w-[4.5rem] text-center leading-[1.1]">{label}</span>
                <span className="font-mono text-[7px] font-semibold uppercase tracking-wide text-zap-ink-faint">
                  Soon
                </span>
              </NavLink>
            );
          }
          return (
            <NavLink
              key={item.slug}
              to={to}
              className={`flex min-h-[44px] min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 py-1 font-body text-[9px] font-semibold leading-tight tracking-tight ${
                active ? "text-zap-teal" : "text-zap-ink-muted"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
              <span className="max-w-[4.5rem] text-center leading-[1.1]">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardMobileNav;
