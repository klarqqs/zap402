import type { ReactNode } from "react";

/**
 * Icon next to section titles — no bordered tile; color only (matches “remove container from icons”).
 */
export const dashboardSectionIconBoxClass =
  "inline-flex shrink-0 items-center justify-center text-zap-brand";

export const dashboardSectionDangerIconBoxClass =
  "inline-flex shrink-0 items-center justify-center text-zap-error";

export const dashboardSectionIconLucideProps = {
  size: 18 as const,
  strokeWidth: 2 as const,
};

interface DashboardSectionIconProps {
  children: ReactNode;
  variant?: "default" | "danger";
  className?: string;
}

export function DashboardSectionIcon({
  children,
  variant = "default",
  className = "",
}: DashboardSectionIconProps) {
  const base =
    variant === "danger" ? dashboardSectionDangerIconBoxClass : dashboardSectionIconBoxClass;
  return (
    <span className={[base, className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
