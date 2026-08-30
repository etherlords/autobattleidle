import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "worker/src/**/*.test.ts"],
    css: true,
    environment: "node",
  },
});
