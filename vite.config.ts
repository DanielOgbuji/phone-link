import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // If your backend runs on a different port during development,
  // uncomment and adapt the proxy below so requests to /invitations are forwarded
  // to your API instead of Vite serving index.html.
  // server: {
  //   proxy: {
  //     '/invitations': {
  //       target: 'http://localhost:4000',
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
})
