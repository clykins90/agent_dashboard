// eslint.config.ts (or .mjs)
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: [
      "node_modules/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/.nx/**",
      "**/coverage/**",
      "**/next-env.d.ts",
      "**/*.min.js",
      "**/bundle*.js",
    ],
  },

  ...compat.extends("plugin:@typescript-eslint/recommended"),

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  ...compat
    .extends("next/core-web-vitals", "next/typescript")
    .map((cfg) => ({
      ...cfg,
      files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
      settings: {
        ...(cfg.settings ?? {}),
        next: { rootDir: ["apps/web"] },
      },
    })),

  {
    files: ["apps/agent-api/**/*.{ts,tsx,js,jsx}"],
    languageOptions: { globals: globals.node },
    rules: {
      "@next/next/*": "off",
    },
  },

  {
    files: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest, ...globals.vitest },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // (Optional) 5) Type-aware rules (enable if you want deeper checks)
  // {
  //   files: [
  //     "apps/web/**/*.{ts,tsx}",
  //     "apps/agent-api/**/*.{ts,tsx}",
  //   ],
  //   languageOptions: {
  //     parserOptions: {
  //       project: [
  //         "apps/web/tsconfig.json",
  //         "apps/agent-api/tsconfig.json",
  //       ],
  //       tsconfigRootDir: __dirname,
  //     },
  //   },
  //   rules: {
  //     "@typescript-eslint/no-floating-promises": "error",
  //     "@typescript-eslint/await-thenable": "error",
  //     "@typescript-eslint/no-misused-promises": "error",
  //   },
  // },
];