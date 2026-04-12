// src/components/dashboard/DashboardSidebar.tsx
// FIX: Clicking "Chat" nav link no longer clears chat state.
// Only the "New chat" button triggers a fresh conversation.

import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { useWallet } from "@/hooks/useWallet";
import {
  SIDEBAR_SECTIONS,
  TERMINAL_NAV_BY_SLUG,
  type TerminalSectionSlug,
} from "@/constants/terminalNav";

const activeLinkClass =
  "flex h-10 items-center gap-2 rounded-lg px-3 font-body text-[15px] text-zap-ink";

const inactiveLinkClass =
  "flex h-10 items-center gap-2 rounded-lg px-3 font-body text-[15px] text-zap-ink transition-colors hover:text-zap-ink";

const actionLinkClass =
  "flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left font-body text-[15px] text-zap-ink transition-colors hover:text-zap-ink";

export interface DashboardSidebarProps {
  mobileOpen: boolean;
  onNavigate: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  mobileOpen,
  onNavigate,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useWallet();

  const isTerminalActive = (slug: TerminalSectionSlug) => {
    const to = `/terminal/${slug}`;
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const handleAction = (slug: TerminalSectionSlug) => {
    if (slug === "logout") {
      disconnect();
      onNavigate();
      navigate("/");
    }
  };

  const handleNewChat = () => {
    // FIX: New chat button explicitly passes newChat: true to reset state
    onNavigate();
    navigate("/terminal/chat", { state: { newChat: true } });
  };

  const handleChatNavClick = () => {
    // FIX: Clicking Chat in nav just navigates — NO state passed.
    // TerminalChatPage treats no-state navigation as "preserve current state".
    onNavigate();
    navigate("/terminal/chat"); // intentionally NO state
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] md:hidden"
          aria-label="Close navigation"
          onClick={onNavigate}
        />
      ) : null}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-zap-bg-alt transition-transform duration-200 ease-out",
          "w-[min(280px,90vw)]",
          "md:w-[260px] md:min-w-[260px]",
          "md:static md:z-0 md:h-full md:shrink-0 md:max-h-none md:translate-x-0",
        ].join(" ")}
      >
        <nav
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 py-12"
          aria-label="Workspace"
        >
          {/* ── New Chat button — always starts fresh ── */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex h-10 w-full items-center justify-center gap-1 rounded-2xl bg-zap-brand px-4 font-body text-[15px] font-normal text-black transition-all hover:opacity-90 active:scale-[0.985]"
            >
              <Plus size={16} strokeWidth={2} className="shrink-0" aria-hidden />
              New chat
            </button>
          </div>

          {SIDEBAR_SECTIONS.map((section, sectionIdx) => (
            <div
              key={sectionIdx}
              className={sectionIdx > 0 ? "mt-4 border-t border-zap-bg-alt pt-4" : ""}
            >
              {section.title ? (
                <p className="px-3 pb-1 font-body text-[11px] font-semibold uppercase tracking-[0.06em] text-zap-ink-muted/60">
                  {section.title}
                </p>
              ) : null}

              <div className="space-y-0.5">
                {section.slugs?.map((slug) => {
                  const item = TERMINAL_NAV_BY_SLUG[slug];
                  if (!item) return null;
                  const Icon = item.icon;

                  if (item.isAction) {
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => handleAction(slug)}
                        className={actionLinkClass}
                      >
                        <Icon size={17} strokeWidth={1.75} className="shrink-0" aria-hidden />
                        {item.label}
                      </button>
                    );
                  }

                  const to = `/terminal/${item.slug}`;
                  const active = isTerminalActive(slug);

                  // FIX: Chat nav uses custom handler that preserves state
                  if (slug === "chat") {
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={handleChatNavClick}
                        className={active ? activeLinkClass : inactiveLinkClass}
                      >
                        <Icon
                          size={17}
                          strokeWidth={active ? 2.25 : 1.75}
                          className="shrink-0"
                          aria-hidden
                        />
                        {item.label}
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={item.slug}
                      to={to}
                      className={() => (active ? activeLinkClass : inactiveLinkClass)}
                      onClick={onNavigate}
                      end={false}
                    >
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.25 : 1.75}
                        className="shrink-0"
                        aria-hidden
                      />
                      {item.label}
                    </NavLink>
                  );
                })}

                {section.links?.map((link) => {
                  const Icon = link.icon;
                  const active =
                    pathname === link.to || pathname.startsWith(`${link.to}/`);

                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={() => (active ? activeLinkClass : inactiveLinkClass)}
                      onClick={onNavigate}
                      end={link.to === "/network"}
                    >
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.25 : 1.75}
                        className="shrink-0"
                        aria-hidden
                      />
                      {link.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;