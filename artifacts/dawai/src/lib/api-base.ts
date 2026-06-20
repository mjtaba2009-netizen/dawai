// Centralized API/base-path resolution shared by direct fetch() calls and the
// router, so web and native (Capacitor) builds stay consistent.
//
// Web build:    BASE_URL is the served base path (e.g. "/dawai/") and the API is
//               reached same-origin under it — behavior is unchanged.
// Mobile build (Capacitor): assets are built with BASE_PATH="./", so BASE_URL is
//               "./". The native shell runs from capacitor://localhost and must
//               call the deployed backend instead. Set VITE_API_BASE_URL at build
//               time (see the build:mobile script / capacitor.config.ts) to the
//               origin where the API answers, e.g. https://your-app.replit.app

const remote = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/+$/,
  "",
);

/** Deployed backend base for native builds; undefined on web (same-origin). */
export const REMOTE_API_BASE = remote || undefined;

/**
 * Prefix for direct fetch() calls, e.g. `${API_PREFIX}/api/...`.
 * Web: the served base path ("/dawai"). Mobile: the deployed backend origin.
 */
export const API_PREFIX =
  REMOTE_API_BASE ?? import.meta.env.BASE_URL.replace(/\/+$/, "");

/**
 * React Router basename. In mobile builds BASE_URL is "./", which is not a valid
 * router path prefix — normalize it to "/". Web keeps its real base ("/dawai/").
 */
export const ROUTER_BASENAME =
  import.meta.env.BASE_URL === "./" ? "/" : import.meta.env.BASE_URL;
