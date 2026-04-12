import type { ReactNode } from "react";

import {
  DashboardSectionIcon,
  dashboardSectionIconLucideProps,
} from "@/sections/dashboard/DashboardSectionIcon";

/** Icon 18px + gap-3 — lines up body copy with title text (ZapPage “Why Zap402” pattern). */
export const dashboardSectionBodyIndentClass =
  "pl-[calc(18px+0.75rem)]";

const titleDefaultClass =
  "font-body text-xl font-semibold tracking-tight text-zap-ink md:text-2xl";

const titleLgClass =
  "font-body text-2xl font-semibold tracking-tight text-zap-ink md:text-3xl";

export interface DashboardSectionHeaderProps {
  /** Lucide icon element, e.g. `<User {...dashboardSectionIconLucideProps} />` */
  icon: ReactNode;
  title: string;
  titleSize?: "default" | "lg";
  iconVariant?: "default" | "danger";
  /** Use error-colored heading (e.g. danger zone). */
  dangerTitle?: boolean;
  /** Indented under the title row (descriptions, amounts, etc.) */
  children?: ReactNode;
}

/**
 * Section title row: icon and heading share one baseline (items-center), matching public Zap page headers.
 */
export function DashboardSectionHeader({
  icon,
  title,
  titleSize = "default",
  iconVariant = "default",
  dangerTitle = false,
  children,
}: DashboardSectionHeaderProps) {
  const baseTitle = titleSize === "lg" ? titleLgClass : titleDefaultClass;
  const titleClass = dangerTitle
    ? baseTitle.replace("text-zap-ink", "text-zap-error")
    : baseTitle;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-3">
        <DashboardSectionIcon variant={iconVariant}>{icon}</DashboardSectionIcon>
        <h2 className={`${titleClass} min-w-0 leading-tight`}>{title}</h2>
      </div>
      {children != null ? (
        <div className={`${dashboardSectionBodyIndentClass} min-w-0`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
