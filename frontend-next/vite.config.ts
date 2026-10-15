import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type ProxyOptions } from "vite"

// API calls go to the Java backend. Through the proxy the API is same-origin for the browser,
// so drop the Origin header, which Spring would otherwise check against its CORS list.
const javaApi: ProxyOptions = {
  target: "http://localhost:8080",
  configure: (proxy) => proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin")),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  // 5173 belongs to the original frontend, so both can run side by side.
  server: { port: 5174, proxy: { "/api": javaApi } },
  preview: { port: 4174, proxy: { "/api": javaApi } },
})
