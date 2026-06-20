import type { CapacitorConfig } from '@capacitor/cli';

// NOTE on `bundledWebRuntime`: this key was removed in Capacitor 5+. From v5
// onward the web runtime is always external (the equivalent of the old
// `bundledWebRuntime: false`), so it is no longer a valid config option and is
// intentionally omitted here. This project uses Capacitor 8.
const config: CapacitorConfig = {
  appId: 'com.promptifyiq.dawai',
  appName: 'Dawai',

  // Vite emits the built web assets here (see `build.outDir` in vite.config.ts).
  // Build with `pnpm --filter @workspace/dawai run build:mobile` first so the
  // assets use a relative base path (base: './') the WebView can resolve.
  webDir: 'dist/public',

  // OPTIONAL — live-reload against a running dev server while developing the
  // native shell. Point this at your Replit dev URL (include the /dawai/ base)
  // and run `npx cap sync` again. Leave commented for store/production builds.
  // server: {
  //   url: 'https://<your-repl>.replit.dev/dawai/',
  //   cleartext: true,
  // },
};

export default config;
