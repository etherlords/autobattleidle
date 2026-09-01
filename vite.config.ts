import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: "./",
  build: {
    rollupOptions: {
      input:
        mode === "visual-lab"
          ? { app: "index.html", visualLab: "visual-lab.html" }
          : { app: "index.html" },
    },
  },
}));
