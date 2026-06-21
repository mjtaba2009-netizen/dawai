// Centralized base-path resolution for the router, so web and native
// (Capacitor) builds stay consistent.
//
// Web build:    BASE_URL is the served base path (e.g. "/dawai/").
// Mobile build (Capacitor): assets are built with BASE_PATH="./", so BASE_URL is
//               "./" — normalized to "/" below.

/**
 * React Router basename. In mobile builds BASE_URL is "./", which is not a valid
 * router path prefix — normalize it to "/". Web keeps its real base ("/dawai/").
 */
export const ROUTER_BASENAME =
  import.meta.env.BASE_URL === "./" ? "/" : import.meta.env.BASE_URL;
