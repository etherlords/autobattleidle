import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".release", ".vault-cache", ".trash"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      complexity: ["error", 12],
      "max-depth": ["error", 4],
    },
  },
  {
    files: ["src/domain/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/game",
                "**/game/**",
                "**/ui",
                "**/ui/**",
                "**/persistence",
                "**/persistence/**",
                "**/app",
                "**/app/**",
              ],
              message: "Domain stays pure.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/game/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/ui",
                "**/ui/**",
                "**/persistence",
                "**/persistence/**",
                "**/app",
                "**/app/**",
              ],
              message: "Game may depend only on domain.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/game",
                "**/game/**",
                "**/persistence",
                "**/persistence/**",
                "**/app",
                "**/app/**",
              ],
              message: "UI may depend only on domain.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/persistence/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/game", "**/game/**", "**/ui", "**/ui/**", "**/app", "**/app/**"],
              message: "Persistence may depend only on domain.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-nested-ternary": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSIndexedAccessType",
          message: "Name cross-module contracts instead of indexing another contract type.",
        },
      ],
    },
  },
);
