import React from "react";
import { CircleUser, Menu } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { LogoTiles } from "@/components/protocol/LogoTiles";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TERMINAL_DEFAULT_PATH } from "@/constants/terminalNav";
const publicNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "font-body text-[11px] font-normal uppercase tracking-[0.12em] transition-colors",
    isActive ? "text-zap-accent" : "text-zap-ink-muted hover:text-zap-ink",
  ].join(" ");

export interface DashboardTopBarProps {
  /** Omitted on public creator pages (no sidebar). */
  onOpenMenu?: () => void;
  /** `public` = logo + compact app links for share URLs; `dashboard` = sidebar shell. */
  variant?: "dashboard" | "public";
}

const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  onOpenMenu,
  variant = "dashboard",
}) => {
  const { pathname } = useLocation();
  const isPublic = variant === "public";

  return (
    <header
      className="z-30 flex h-14 min-h-14 shrink-0 items-center justify-between gap-2 
             bg-zap-bg-alt px-3 backdrop-blur-md sm:gap-3 md:px-5
             border-b border-zap-bg-alt"
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        {!isPublic && onOpenMenu ? (
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--card-border-soft)] bg-zap-bg-alt text-zap-ink md:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMenu}
          >
            <Menu size={20} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}

        <div className="min-w-0 shrink">
          {isPublic ? (
            <LogoTiles variant="wordmark" homeTo="/" />
          ) : (
            <LogoTiles variant="wordmark" homeTo={TERMINAL_DEFAULT_PATH} />
          )}
        </div>

        {isPublic ? (
          <nav className="hidden items-center gap-5 md:flex" aria-label="App">
            <NavLink to="/network" className={publicNavLinkClass}>
              NETWORK
            </NavLink>
            <NavLink
              to={TERMINAL_DEFAULT_PATH}
              className={({ isActive }) =>
                publicNavLinkClass({
                  isActive:
                    isActive || pathname.startsWith("/terminal"),
                })
              }
            >
              TERMINAL
            </NavLink>
            <NavLink to="/register" className={publicNavLinkClass}>
              CREATE
            </NavLink>
          </nav>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        {!isPublic ? (
          <>
            <ThemeToggle minimal />
            <Link
              to="/terminal/profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--card-border-soft)] bg-zap-bg-alt text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:text-zap-ink"
              aria-label="Open profile"
              title="Profile"
            >
              <CircleUser size={18} strokeWidth={1.75} aria-hidden />
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
};

export default DashboardTopBar;
