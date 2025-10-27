import pluginNext from "@next/eslint-plugin-next";
import globals from "globals";

export default [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**"
    ]
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node }
    },
    plugins: {
      "@next/next": pluginNext
    },
    rules: {
      ...pluginNext.configs["core-web-vitals"].rules
    }
  }
];
