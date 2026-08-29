import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["output/playwright/abi026-generate-fixtures.test.ts"] },
});
