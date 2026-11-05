import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project sites need `base: /<repo-name>/`.
// For user/org sites (username.github.io) or Netlify/Vercel/Cloudflare, leave as "/".
const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  plugins: [react()],
  base,
  server: { port: 5173 },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
