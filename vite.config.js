import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Khi chạy "npm run dev" để test trên máy, chuyển các lệnh gọi
      // /api/... sang server Node đang chạy ở cổng 3000.
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
  },
});
