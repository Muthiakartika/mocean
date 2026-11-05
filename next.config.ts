import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind CSS v4 through Turbopack (default setup of create-next-app 16.4).
  turbopack: {
    rules: {
      "*.css": {
        // Only plain stylesheets: *.module.css files must stay CSS Modules.
        condition: { all: [{ not: "foreign" }, { not: { path: /\.module\.css$/ } }] },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Every URL on the original WordPress site ends with "/".
  trailingSlash: true,
  poweredByHeader: false,

  experimental: {
    // CSS comes inside the HTML instead of three render-blocking requests (speed test 2026-11-05: ~480ms on phones).
    inlineCss: true,
  },

  images: {
    // Sizes close to the original WordPress srcset widths.
    deviceSizes: [375, 390, 640, 768, 1024, 1280, 1440, 1920, 2048],
    formats: ["image/avif", "image/webp"],
  },

  async redirects() {
    return [
      // Old image URLs (indexed by Google Images, linked from elsewhere) keep working.
      { source: "/wp-content/uploads/:path*", destination: "/images/uploads/:path*", permanent: true },
      // Old Yoast sitemap URLs point Search Console to the new sitemap.
      { source: "/sitemap_index.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/page-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/post-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
    ];
  },

  async headers() {
    // Block indexing of anything that is not the production deployment.
    if (process.env.VERCEL_ENV === "production" || process.env.SITE_ENV === "production") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
