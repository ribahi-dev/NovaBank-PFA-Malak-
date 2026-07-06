// Configuration Vite : plugin React + proxy API en développement.
// Le proxy évite les soucis CORS en dev : le navigateur appelle /api/...
// sur le même port que le front, Vite relaie vers FastAPI (port 8000).
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
