// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import react from "@astrojs/react";

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
  integrations: [react()],
});
