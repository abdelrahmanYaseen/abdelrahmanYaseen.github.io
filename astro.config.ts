import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://abdelrahmanYaseen.github.io",
  output: "static",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/og/"),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en-US", ar: "ar-SA" },
      },
    }),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true,
    },
  },
  vite: {
    resolve: {
      alias: {
        "@lib": "/src/lib",
        "@components": "/src/components",
        "@artifacts": "/src/artifacts",
      },
    },
    ssr: {
      external: ["sharp"],
    },
    build: {
      rollupOptions: {
        external: ["sharp"],
      },
    },
    optimizeDeps: {
      exclude: ["sharp"],
    },
  },
});
