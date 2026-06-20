import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import { REMOTE_API_BASE } from "./lib/api-base";
import "./index.css";

// Native (Capacitor) builds run from capacitor://localhost and cannot reach the
// API via same-origin "/api" requests. When VITE_API_BASE_URL is set at build
// time (see the build:mobile script / capacitor.config.ts), point the generated
// API client at the deployed backend and forward the saved bearer token so
// authenticated endpoints work inside the native shell. On web this stays unset,
// so same-origin behavior is unchanged.
if (REMOTE_API_BASE) {
  setBaseUrl(REMOTE_API_BASE);
  setAuthTokenGetter(() => {
    try {
      const saved = localStorage.getItem("dawai_user");
      return saved ? ((JSON.parse(saved) as { token?: string })?.token ?? null) : null;
    } catch {
      return null;
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
