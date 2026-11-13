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
      // WordPress RSS feeds (Search Console still crawls e.g. /surf-retreat/feed/, 2026-11-11): back to the page / news.
      { source: "/feed/", destination: "/news/", permanent: true },
      { source: "/comments/feed/", destination: "/", permanent: true },
      { source: "/:path+/feed/", destination: "/:path+/", permanent: true },
      // Old page URLs that the live WordPress site answers with a 301 (checked 2026-11-06). Google still shows some of
      // them (Search Console: /dive-trips/ 16 clicks at position 4 in 90 days) and some have backlinks (Ahrefs), so they
      // keep pointing at the same pages. 301 as on WordPress. Exact paths only: /surf-camp/surf-spots/lombok-2/ is a page.
      ...(
        [
          ["/dive-trips/", "/fun-diving/"],
          ["/dive-trips/fun-diving/", "/fun-diving/"],
          ["/dive-trips/scuba-diving/", "/scuba-diving/"],
          ["/dive-trips/discover-scuba-diving/", "/discover-scuba-diving/"],
          ["/dive-trips/snorkeling/", "/snorkeling/"],
          ["/dive-trips/manta-rays/", "/manta-rays/"],
          ["/dive-trips/dive-sites/", "/dive-sites/"],
          ["/surf-camp/", "/surf-trip/"],
          ["/surf-camp/surf-trip/", "/surf-trip/"],
          ["/surf-camp/surf-lesson/", "/surf-lesson/"],
          ["/surf-camp/surf-spots/", "/surf-spots/"],
          ["/surf-camp/surf-spots/bali/", "/surf-spots/bali/"],
          ["/surf-camp/surf-spots/canggu/", "/surf-spots/canggu/"],
          ["/surf-camp/surf-spots/uluwatu/", "/surf-spots/uluwatu/"],
          ["/surf-camp/surf-spots/lombok/", "/surf-spots/lombok/"],
          ["/surf-camp/surf-spots/nusa-lembongan/", "/surf-spots/nusa-lembongan/"],
          ["/surf-spots/scar-reef/", "/scar-reef/"],
          ["/travel-lombok-bali-sumbawa/", "/travel-lombok-sumbawa/"],
          ["/accommodation/tropical-beach-resort/", "/tropical-beach-resort/"],
          // On WordPress this page now redirects too (it used to be a copy with a canonical to the beach resort page).
          ["/luxury-surf-resort/", "/tropical-beach-resort/"],
        ] as const
      ).map(([source, destination]) => ({ source, destination, statusCode: 301 as const })),
      // The local tour pages were taken out on 2026-11-13 (owner: no reliable local tour operator; archived in
      // docs/archive/local-tours/). Their URLs, and the older WordPress ones that led to them, go to the Sumbawa guide,
      // which still describes the waterfalls and the lake. Remove these lines when the pages come back.
      ...[
        "/sumbawa-indonesia/",
        "/sumbawa-indonesia-tour/",
        "/sumbawa-indonesia-tour/:path*",
        "/kalela-waterfall/",
      ].map((source) => ({ source, destination: "/things-to-do-in-sumbawa-indonesia/", statusCode: 301 as const })),
    ];
  },

  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    // Block indexing of anything that is not the production deployment.
    if (!(process.env.VERCEL_ENV === "production" || process.env.SITE_ENV === "production")) {
      return [{ source: "/:path*", headers: noindex }];
    }
    // Production is also served on its *.vercel.app address (mocean-six.vercel.app was indexable, 2026-11-06): only the
    // real domain may be indexed. The www host is redirected to the bare domain in the Vercel domain settings.
    return [{ source: "/:path*", missing: [{ type: "host", value: "moceanbeachresort\\.com" }], headers: noindex }];
  },
};

export default nextConfig;
