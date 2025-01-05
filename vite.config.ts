import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
 
export default defineConfig({
  plugins: [react()],
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
});