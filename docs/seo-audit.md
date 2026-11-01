# SEO Audit — moceanbeachresort.com

Full raw data per page (every meta tag, every JSON-LD block, icons) is in [`audit/seo.json`](audit/seo.json).
Titles, descriptions, H1–H3 per page are in [`page-inventory.md`](page-inventory.md).

## Plugin & global settings

- **Yoast SEO v28.8** generates title, description, canonical, robots, OG, Twitter and a JSON-LD `@graph`.
- `<html lang="en-US">`, `og:locale = en_US`, `og:site_name = moceanbeachresort.com`.
- Robots meta on indexable pages: `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- Favicons: `2025/05/mocean-favicon-87x87.jpg` (32×32), `mocean-favicon-300x300.jpg` (192×192 + apple-touch-icon).
- Twitter: `twitter:card = summary_large_image` (no `twitter:site`). Yoast also emits `twitter:label1/data1` ("Est. reading time") — not needed by search engines, will be dropped unless you want them.

## Indexing

| URL | Robots | Canonical | Action in Next.js |
|---|---|---|---|
| 54 normal URLs | index, follow | self | Same |
| `/luxury-surf-resort/` | index, follow | → `/tropical-beach-resort/` | Serve same page with same canonical (keeps current behaviour). Alternative: 301 → `/tropical-beach-resort/` — **your call** |
| `/surf-camp/surf-spots/lombok-2/` | **noindex**, follow | none | Keep as `noindex`, exclude from sitemap (it's not in the current sitemap either) |

## Sitemap & robots

- Current: `/sitemap_index.xml` → `post-sitemap.xml`, `page-sitemap.xml` (55 URLs). `/sitemap.xml` and `/wp-sitemap.xml` redirect to the index.
- New: `/sitemap.xml` (Next.js `sitemap.ts`) with the 55 URLs on `https://moceanbeachresort.com`.
  Add 301 redirects `/sitemap_index.xml`, `/page-sitemap.xml`, `/post-sitemap.xml`, `/wp-sitemap.xml` → `/sitemap.xml` so Search Console keeps working.
- `robots.ts`: allow all, `Sitemap: https://moceanbeachresort.com/sitemap.xml`. On Vercel preview (`VERCEL_ENV !== "production"`) → `Disallow: /` and `X-Robots-Tag: noindex`.

## Structured data

Two sources on every page:

1. **Yoast graph** (all pages): `WebPage`, `ImageObject`, `BreadcrumbList`, `WebSite` (+ `SearchAction` to `/?s=`).
   The 8 posts also have `Article` + `Person` (author).
2. **Hand-written JSON-LD in Elementor HTML widgets** (part of page content):
   | Type | Pages |
   |---|---|
   | `Resort` (address, phone, email, amenities, priceRange) | home |
   | `FAQPage` | 28 pages (home, pricing, scuba-diving, fun-diving, snorkeling, surf pages, tours, dive-sites, several posts…) |
   | `TouristAttraction` | agal-waterfall, danau-lebo, kalela-waterfall |
   | `Restaurant` | restaurant |

Plan: reproduce both, byte-for-byte content, rendered as `<script type="application/ld+json">`.
Two things to fix only with your approval:
- `WebSite.potentialAction` → `/?s=` search. The Next.js site will have no search, so this action would point to nothing. Recommend removing it.
- The Resort schema email is `bookings@moceanbeachresort.com`, but the visible footer/pages use **`bookings@moceandive.com`** (56 pages). Confirm which is correct.

No review/rating markup exists — nothing to worry about there.

## Analytics & tracking found

| Tool | Found? | Detail |
|---|---|---|
| Google Analytics 4 | **No** | No `G-` ID in any page |
| Google Tag Manager | **No** | |
| Google Ads | **No** | |
| Meta Pixel | No | |
| Microsoft Clarity | No (only the word appears in text/CSS) | |
| **Ahrefs Web Analytics** | **Yes** | `<script src="https://analytics.ahrefs.com/analytics.js" data-key="BIyHVfWYrucIZ49dWHIDlw" async>` |
| Cookie/consent banner | No | |
| Booking conversion events | None in page code | Cloudbeds tracks on its own domain |

If GA4/GTM is injected outside the HTML (e.g. server-side or via Cloudflare Zaraz), I can't see it — **please confirm** there is no GA4 property tied to this site.

## Booking & contact destinations (must not change)

- Cloudbeds: `https://us2.cloudbeds.com/reservation/yPrE1K` — header "Book Now" (`_blank`, `nofollow`), hero slides (`_self`), floating book button (immersive overlay via `widget/load/yPrE1K/immersive`), many in-page buttons.
- WhatsApp: `https://wa.me/6282144191647` (234 links).
- Email: `mailto:bookings@moceandive.com` (56 pages), `mailto:bookings@moceanbeachresort.com` (3 links).

## URLs & redirects

All 56 URLs keep their exact path with trailing slash (`trailingSlash: true`). No URL needs to change, so **no 301s for pages**.
Redirects that help keep old traffic working:
- `/wp-content/uploads/:path*` → `/images/uploads/:path*` (301) — images indexed in Google Images keep resolving.
- `/feed/`, `/comments/feed/`, `/?s=` — WordPress-only, will 404 (fine) unless you want redirects to `/`.
- `/wp-admin`, `/wp-login.php` — 404 after migration (expected).

## Image alt text

1,186 of 1,263 image tags have an empty `alt`. They will be migrated **as-is** (empty) per PRD §3.4 "use original alt text". Filling them in is a recommended follow-up SEO improvement, not part of the clone.
