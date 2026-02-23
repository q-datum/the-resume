import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    server: {
        host: true,
        port: 3000,
        strictPort: true,
        proxy: {
            "/api": {
                target: process.env.BACKEND_ORIGIN ?? "http://backend:8080",
                changeOrigin: true,
            },
        },
    },
});
