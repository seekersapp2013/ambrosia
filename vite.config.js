// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3001, // ← match the port your app actually runs on
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "i8xudk-ip-20-55-45-255.tunnelmole.net" // no protocol
    ],
    hmr: {
      host: "i8xudk-ip-20-55-45-255.tunnelmole.net",
      protocol: "wss",
      clientPort: 443
    }
  }
});








