import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  server: {
    port: 9527,
    open: false,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
})
