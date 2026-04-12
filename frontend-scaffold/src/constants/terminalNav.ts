import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Home,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  ShoppingBag,
  Timer,
} from "lucide-react";

/** URL segment under `/terminal/:section`. */
export type TerminalSectionSlug =
  | "profile"
  | "discover"
  | "chat"
  | "feed"
  | "history"
  | "settings"
  | "request"
  | "logout";

export type TerminalNavItem = {
  slug: TerminalSectionSlug;
  tabId: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  /** If true, clicking triggers an action instead of navigating to a route */
  isAction?: boolean;
};

export const TERMINAL_NAV: readonly TerminalNavItem[] = [
  { slug: "profile",   tabId: "home",      label: "Profile",    icon: Home },
  { slug: "chat",      tabId: "chat",       label: "Chat",       icon: MessageSquare },
  { slug: "discover",  tabId: "search",     label: "Discover",   icon: Search },
  { slug: "history",   tabId: "purchases",  label: "History",    icon: Clock },
  { slug: "settings",  tabId: "config",     label: "Settings",   icon: Settings },
  { slug: "logout",    tabId: "logout",     label: "Log out",    icon: LogOut, isAction: true },
] as const;

export const SIDEBAR_SECTIONS: readonly SidebarSection[] = [
  {
    title: "",
    slugs: ["chat", "discover", "history", "settings", "logout"],
  },
] as const;

/** Ko-fi–style group labels for the left sidebar. */
export type SidebarSection = {
  title: string;
  slugs?: readonly TerminalSectionSlug[];
  links?: readonly {
    to: string;
    label: string;
    icon: LucideIcon;
  }[];
};

export const TERMINAL_NAV_BY_SLUG: Record<TerminalSectionSlug, TerminalNavItem> =
  Object.fromEntries(TERMINAL_NAV.map((n) => [n.slug, n])) as Record<
    TerminalSectionSlug,
    TerminalNavItem
  >;

const SLUG_TO_TAB = Object.fromEntries(
  TERMINAL_NAV.map((n) => [n.slug, n.tabId]),
) as Record<TerminalSectionSlug, string>;

const TAB_TO_SLUG = Object.fromEntries(
  TERMINAL_NAV.map((n) => [n.tabId, n.slug]),
) as Record<string, TerminalSectionSlug>;

export function terminalSlugToTabId(slug: string | undefined): string {
  if (!slug) return "home";
  const tab = SLUG_TO_TAB[slug as TerminalSectionSlug];
  return tab ?? "home";
}

export function terminalTabIdToSlug(tabId: string): TerminalSectionSlug {
  return TAB_TO_SLUG[tabId] ?? "home";
}

export function isTerminalSectionSlug(s: string): s is TerminalSectionSlug {
  return (TERMINAL_NAV as readonly TerminalNavItem[]).some((n) => n.slug === s);
}

export const TERMINAL_LEGACY_SLUG_REDIRECT: Record<string, TerminalSectionSlug> = {
  overview: "profile",
  home: "profile",
  tips: "profile",
  unlocks: "profile",
  clone: "profile",
  search: "discover",
  purchases: "history",
};

export const TERMINAL_DEFAULT_PATH = "/terminal/chat";