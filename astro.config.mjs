// @ts-check
import { defineConfig, fontProviders, envField } from "astro/config";

import react from "@astrojs/react";

// GitHub Pages のプロジェクトサイトはサブパスで配信される．
// CI では本番 / PR プレビューごとに BASE_PATH を渡す（ローカルでは "/"）．
const site = process.env.SITE_URL ?? "https://tskaigi.github.io";
const base = process.env.BASE_PATH ?? "/";

// https://astro.build/config
export default defineConfig({
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Outfit",
      cssVariable: "--font-outfit",
      weights: [300, 600],
      styles: ["normal"],
      subsets: ["latin"],
      display: "swap",
    },
  ],
  site,
  base,
  output: "static",
  integrations: [react()],
  env: {
    schema: {
      // PR プレビューを検索エンジンに載せないためのフラグ（preview.yml で true にする）
      NOINDEX: envField.boolean({
        context: "server",
        access: "public",
        default: false,
      }),
    },
  },
});
