import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // <-- make sure Tailwind styles are imported
import { clearExpiredToken } from './utils/api'

// Clear any expired tokens on app startup
clearExpiredToken();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => console.log("✅ Service worker registered:", reg.scope))
      .catch((err) => console.error("❌ Service worker failed:", err));
  });
}