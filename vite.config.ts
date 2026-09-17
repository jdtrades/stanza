import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  resolve: { tsconfigPaths: true },
  optimizeDeps: {
    exclude: ["@qvac/sdk"],
  },
  ssr: {
    external: ["@qvac/sdk"],
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "node-server",
            rollupConfig: {
              external: ["@qvac/sdk"],
            },
          }),
        ]
      : []),
    viteReact(),
  ],
}));
