import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const PUBLIC_FILES = ["brand-logo.png", "brand-logo-tight.png", "brand-logo-light.png", "brand-mark-light.png", "favicon.png"];

export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    {
      name: "hire-entry",
      enforce: "post",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url, "http://localhost");
          if (PUBLIC_FILES.includes(url.pathname.slice(1))) {
            res.setHeader("Content-Type", "image/png");
            res.end(readFileSync(new URL(`./public${url.pathname}`, import.meta.url)));
            return;
          }
          if (["/", "/login", "/portal"].includes(url.pathname)) req.url = `/hire.html${url.search}`;
          next();
        });
      },
      generateBundle(_options, bundle) {
        for (const name of PUBLIC_FILES) {
          this.emitFile({ type: "asset", fileName: name, source: readFileSync(new URL(`./public/${name}`, import.meta.url)) });
        }
        this.emitFile({ type: "asset", fileName: "robots.txt", source: "User-agent: *\nDisallow: /login\nDisallow: /portal\nSitemap: https://hire.statybos24.lt/sitemap.xml\n" });
        this.emitFile({ type: "asset", fileName: "sitemap.xml", source: '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://hire.statybos24.lt/</loc></url></urlset>' });
        const html = bundle["hire.html"];
        if (html) { html.fileName = "index.html"; bundle["index.html"] = html; delete bundle["hire.html"]; }
      },
    },
  ],
  build: { outDir: "dist-hire", rollupOptions: { input: "hire.html" } },
});
