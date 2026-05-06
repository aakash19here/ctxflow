import { resolve } from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/embed.ts"),
      name: "CtxFlowWidget",
      fileName: "widget",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
