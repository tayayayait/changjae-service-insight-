import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("node_modules/recharts/") || id.includes("node_modules\\recharts\\")) {
            return "vendor-recharts";
          }
          if (id.includes("node_modules/framer-motion/") || id.includes("node_modules\\framer-motion\\")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/@fullstackfamily/manseryeok/") || id.includes("node_modules\\@fullstackfamily\\manseryeok\\")) {
            return "vendor-manseryeok";
          }
          if (id.includes("node_modules/@supabase/supabase-js/") || id.includes("node_modules\\@supabase\\supabase-js\\")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/@radix-ui/") || id.includes("node_modules\\@radix-ui\\")) {
            return "vendor-radix";
          }

          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules\\react\\") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules\\react-dom\\") ||
            id.includes("node_modules/react-router-dom/") ||
            id.includes("node_modules\\react-router-dom\\") ||
            id.includes("node_modules/@tanstack/react-query/") ||
            id.includes("node_modules\\@tanstack\\react-query\\")
          ) {
            return "vendor-react";
          }
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
