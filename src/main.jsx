import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

// Show errors instead of a blank screen
window.addEventListener("error", e => console.error("WindowError:", e?.error || e));
window.addEventListener("unhandledrejection", e => console.error("UnhandledRejection:", e?.reason || e));

const url = import.meta.env.VITE_CONVEX_URL;
if (!url) console.warn("VITE_CONVEX_URL is missing in .env(.local).");

const convex = new ConvexReactClient(url || "");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </React.StrictMode>
);
