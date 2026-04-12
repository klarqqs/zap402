import { useSyncExternalStore } from "react";

export type DocumentTheme = "light" | "dark";

/**
 * Reads `data-theme` on `<html>` so components (e.g. QR colors) stay in sync when the theme toggles,
 * without requiring a shared React context for theme.
 */
export function useDocumentTheme(): DocumentTheme {
  return useSyncExternalStore(
    (onStoreChange) => {
      const el = document.documentElement;
      const obs = new MutationObserver(() => onStoreChange());
      obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
      return () => obs.disconnect();
    },
    () => {
      const t = document.documentElement.getAttribute("data-theme");
      return t === "light" ? "light" : "dark";
    },
    () => "dark",
  );
}
