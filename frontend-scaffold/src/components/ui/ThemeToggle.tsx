import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";

export interface ThemeToggleProps {
  /**
   * When true, shows the current mode (“Light” / “Dark”) before the icon, like other sidebar rows.
   */
  showModeLabel?: boolean;
  /** When true (icon mode only), removes border/background container chrome. */
  minimal?: boolean;
}

/**
 * Icon toggle aligned with header chrome (same footprint as menu / wallet controls).
 * Use `showModeLabel` in the dashboard sidebar next to Network / Settings-style labels.
 */
export function ThemeToggle({ showModeLabel = false, minimal = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const modeLabel = isDark ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        showModeLabel
          ? "inline-flex min-h-[44px] w-full max-w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-body text-[15px] font-medium text-zap-ink-muted transition-colors hover:bg-[#f5f0eb] hover:text-zap-ink dark:hover:bg-white/[0.06] dark:hover:text-zap-ink"
          : minimal
            ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent text-zap-ink-muted transition-colors hover:text-zap-ink"
            : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zap-bg-alt bg-zap-bg-raised text-zap-ink-muted transition-colors hover:border-zap-bg-alt-bright hover:text-zap-ink"
      }
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {showModeLabel ? (
        <>
        <span className="inline-flex shrink-0 items-center justify-center text-zap-ink-muted opacity-90" aria-hidden>
            {isDark ? (
              <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )}
          </span>
          <span className="shrink-0 text-zap-ink-muted">{modeLabel}</span>
         
        </>
      ) : isDark ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
