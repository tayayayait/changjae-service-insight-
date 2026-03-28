import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const RELOAD_KEY = "saju:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 60_000;

const tryAutoReloadForChunkError = () => {
  const now = Date.now();
  const lastReloadAtRaw = sessionStorage.getItem(RELOAD_KEY);
  const lastReloadAt = Number.parseInt(lastReloadAtRaw ?? "", 10);
  const canAutoReload = Number.isNaN(lastReloadAt) || now - lastReloadAt > RELOAD_COOLDOWN_MS;

  if (!canAutoReload) {
    return;
  }

  sessionStorage.setItem(RELOAD_KEY, String(now));
  window.location.reload();
};

window.addEventListener("vite:preloadError", (event) => {
  tryAutoReloadForChunkError();
  (event as Event).preventDefault?.();
});

createRoot(document.getElementById("root")!).render(<App />);
