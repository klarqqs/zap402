import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "zap402-theme";
const LEGACY_STORAGE_KEY = "zap402-theme";

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy === "light" || legacy === "dark") {
    localStorage.setItem(STORAGE_KEY, legacy);
    return legacy;
  }
  return "light";
}

function applyDocumentTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.remove("dark", "light");
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyDocumentTheme(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  return { theme, toggleTheme, setTheme };
};
