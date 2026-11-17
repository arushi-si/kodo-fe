import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: cached across app deploys.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom", "react-redux", "@reduxjs/toolkit"],
          motion: ["framer-motion"],
          realtime: ["socket.io-client", "axios"],
        },
      },
    },
  },
});
