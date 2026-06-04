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

async function subscribeToPush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // Get VAPID public key from backend
    const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/push/vapid-public-key`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const { publicKey } = await res.json();

    // Convert VAPID key
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Send subscription to backend
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(subscription),
    });

    console.log("✅ Push notifications subscribed");
  } catch (err) {
    console.error("❌ Push subscription failed:", err);
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribe after service worker is ready
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").then((reg) => {
      console.log("✅ Service worker registered:", reg.scope);
      // Subscribe to push if user is logged in
      if (localStorage.getItem("token")) {
        subscribeToPush();
      }
    }).catch((err) => console.error("❌ Service worker failed:", err));
  });
}