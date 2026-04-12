/**
 * Shared `PageContainer` `className` for full-page loading states so profile, dashboard,
 * and similar routes share the same vertical rhythm (space above copy vs footer).
 *
 * `!py-10` overrides `PageContainer`’s default `py-8` deterministically.
 */
export const PAGE_CONTAINER_LOADING_CLASS =
  "flex min-h-[60vh] flex-col items-center justify-center gap-4 !py-10";
