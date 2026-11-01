# Handoff — status on 2026-11-01

Read this first when continuing the project (also on another computer).
For Claude Code: *"Read docs/HANDOFF.md, README.md and docs/migration-checklist.md, then continue."*

## Overall status: about 70%

| Area | Status |
|---|---|
| Audit (`docs/page-inventory.md`, `design-audit.md`, `seo-audit.md`) | Done |
| Project setup, fonts, colours, 956 original images | Done |
| Header, desktop + mobile menu, footer, floating WhatsApp / Cloudbeds buttons | Done — matches live site at 1440 and 390 |
| Homepage (12 sections, hero slider, parallax, testimonials, FAQ) | Done — all elements within 2px at 1440 / 1280 / 820 / 390 |
| SEO for all 56 URLs (title, description, canonical, OG, JSON-LD) | Done (`src/data/seo.json`, `src/lib/metadata.ts`) |
| 48 inner pages + 7 blog posts | **Built, all return 200.** Verified so far: matches at 1440 on every page checked; some pages still differ at 390 (see below) |
| Interactions on inner pages (tabs, accordion, fade-in, parallax, lightbox, sliders) | Working (`scripts/check-inner.ts`) |
| Next.js security upgrade 16.4.0 → 16.4.3 | Done, `npm audit` clean |

## Next steps (in order)

1. **Fix mobile (390px) differences on inner pages.**
   Run `bash scripts/compare-all.sh 1440 390` (dev server must run; takes ~70 min, sequential).
   Pages that differed at 390 in the last partial run: `/contact/`, `/discover-scuba-diving/`, `/dive-sites/diving-amed/`,
   `/dive-sites/diving-bali/`, `/dive-sites/diving-komodo-island/`, `/dive-sites/diving-lombok/` (the run crashed after 20 of 110 checks).
   Method that worked so far: `npx tsx scripts/compare-layout.ts <path> 390` → find the first `DIFF` → measure with
   `AUDIT_TARGET=local npx tsx scripts/audit-selectors.ts <path> 390 "<selector>"` vs the live site (no `AUDIT_TARGET`) → usually a missing or mis-ordered original stylesheet.
2. **Lightbox details:** the original also has a toolbar (zoom / fullscreen / share), the image file name as caption, and a zoom-in opening animation (`src/components/elementor/Lightbox.tsx`).
3. **Contact form** (`/contact/`, originally WPForms: Name, a second text field, Email, Message) — needs a decision from the owner (see questions).
4. **`src/app/sitemap.ts` + `src/app/robots.ts`** (URL list: `src/data/routes.ts`, exclude `notInSitemap`). Redirects for old sitemap URLs already exist in `next.config.ts`.
5. Check the remaining viewports **1280, 768, 375** with `compare-layout.ts`, and full-page screenshots (`scripts/capture-screenshots.ts`).
6. Link check (no broken internal links), `npm run build`, Lighthouse, then deployment prep (Vercel) — deploy only with the owner's approval.

## Open questions for the owner

1. Contact form: destination email + email service (Resend / SMTP)?
2. Correct booking email: `bookings@moceandive.com` (shown on pages) or `bookings@moceanbeachresort.com` (schema + homepage)?
3. Is there a GA4/GTM property? Only Ahrefs Analytics was found on the site.
4. `/luxury-surf-resort/`: keep as duplicate with canonical (current) or 301 → `/tropical-beach-resort/`?
5. Keep the white page preloader of the original? (not rebuilt yet)
6. Remove the `WebSite` SearchAction from the schema (points to WordPress search, which won't exist)?
- Answered: images and site belong to the owner (OK to copy 1:1). Inner pages: "renderer + data" approach.

## Things that are easy to get wrong

- **Don't run `create-next-app` or `npm install` without `--prefer-offline` on a slow connection**; `package-lock.json` pins everything.
- **Tailwind only scans `src/components` and `src/app`** (`src/app/globals.css`, `source(none)`). The migrated WordPress HTML uses class names like `mb-20`, `d-block`, `container` that Tailwind would otherwise style differently. Same reason the page wrapper is `.theme-container`, not `.container`.
- Tailwind's preflight reset is **off** on purpose (the original uses browser defaults).
- **CSS order matters** for inner pages: `src/components/elementor/styles.ts` → page `post-<id>.css` → `styles-after.ts`, mirroring the original `<link>` order.
- Turbopack rejects some original CSS (e.g. empty rules `{}`); `convert-css.mjs` cleans those.
- After changing `globals.css` sources or CSS loaders, stop the dev server and delete `.next/` (Turbopack caches).
- Git Bash turns `/pricing/` into a Windows path → use `MSYS_NO_PATHCONV=1`.
- The live site is the source of truth; `docs/audit/source-html/` is the snapshot from 2026-10-31.

## Moving to another computer

Copy the whole project folder **without** `node_modules/` and `.next/`, then on the new PC:

```bash
npm install
npm run dev
```

The comparison scripts need Microsoft Edge (standard on Windows). The migration scripts need Python 3 with `beautifulsoup4` and `lxml` (only to regenerate content).
