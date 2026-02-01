import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent stale PWA Service Worker caches from breaking module imports in preview/dev.
// A previously-installed SW can keep controlling the page and serve outdated JS chunks.
if ("serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    // Best-effort cleanup (no UI impact) – fixes blank screen "Importing a module script failed".
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => undefined);

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .catch(() => undefined);
    }
  } else {
    // If a new SW takes control, reload once so the app picks up the fresh asset manifest.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
