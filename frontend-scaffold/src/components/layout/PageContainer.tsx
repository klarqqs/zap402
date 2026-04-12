import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  /**
   * `editorial` matches `.editorial-container` / Terminal shell — `var(--editorial-max)` (1200px).
   * Prefer it for dashboard + public creator pages so width matches the rest of the app.
   * `full` removes max-width for edge-to-edge sections (e.g. claim hero).
   */
  maxWidth?:
    | "narrow"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "editorial"
    /** ~dashboard main column — use for public creator pages so width matches Terminal beside sidebar. */
    | "zapMain"
    | "full";
  className?: string;
  /**
   * Use `div` when nested inside `DashboardLayout`’s `<main id="main-content">` to avoid duplicate
   * `<main>` and duplicate ids. Default `main` for standalone pages (marketing shell).
   */
  tag?: "main" | "div";
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'lg',
  className = '',
  tag = 'main',
}) => {
  const widths: Record<string, string> = {
    narrow: "max-w-lg",
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    /** Same max width + horizontal padding as `.editorial-container` (see `index.scss`). */
    editorial: "w-full max-w-[var(--editorial-max)] px-4 md:px-6",
    zapMain: "w-full max-w-[var(--zap-creator-page-max)] px-4 md:px-6",
    full: "max-w-none w-full",
  };

  const gutter =
    maxWidth === "editorial" || maxWidth === "zapMain"
      ? ""
      : "px-4 md:px-6";

  const El = tag === "div" ? "div" : "main";
  return (
    <El
      id={tag === "div" ? undefined : "main-content"}
      tabIndex={tag === "div" ? undefined : -1}
      className={`${widths[maxWidth]} mx-auto ${gutter} py-8 ${className} focus:outline-none`}
    >
      {children}
    </El>
  );
};

export default PageContainer;
