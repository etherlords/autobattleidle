import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["output/playwright/abi007-generate-fixtures.test.ts"] },
});
