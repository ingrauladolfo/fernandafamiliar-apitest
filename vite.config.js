import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/wp-json": {
        target: "https://fernandafamiliar.soy",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
