// @ts-check
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import astro from "eslint-plugin-astro";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// 整形は Prettier に任せ，ここではバグにつながる書き方だけを検出する
export default defineConfig([
  globalIgnores(["dist/", ".astro/", "node_modules/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    files: ["*.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
]);
