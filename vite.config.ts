import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
 
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        new RegExp('/pdf\\.worker\\.min\\.js$')
      ]
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  }
}));