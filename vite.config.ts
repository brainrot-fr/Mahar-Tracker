import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, isPreview, mode }) => {
  const isCapacitor = mode === "capacitor";

  return {
  server: { host: "0.0.0.0", port: 3000, strictPort: true },
  preview: { host: "127.0.0.1", port: 8081, strictPort: true },
  build: { outDir: isCapacitor ? ".output/public" : undefined },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(!isCapacitor && (command === "build" || isPreview)
      ? [nitro({ preset: "vercel", serverDir: "./server" })]
      : []),
    viteReact(),
  ],
  };
});
