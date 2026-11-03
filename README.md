# Mocean Beach Resort — Next.js

Migration of https://moceanbeachresort.com/ (WordPress + Elementor) to Next.js.
Goal: look and behave exactly like the original site (see the PRD and `docs/`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

Requires Node.js 20.9+ (tested on 22). Next.js 16.4.3, React 19, Tailwind CSS 4.

## Where things are

| Path | What |
|---|---|
| `src/app/layout.tsx` | Root layout: header, footer, floating WhatsApp/Cloudbeds buttons, fonts, analytics |
| `src/app/page.tsx` | Homepage (hand-built, one component per section in `src/components/home/`) |
| `src/app/<url>/page.tsx` | Inner pages and blog posts — **generated**, one folder per original URL |
| `src/components/layout/` | Header, menu (desktop + mobile), footer, floating buttons |
| `src/components/shared/` | Button, section heading, parallax image, accordion, fade-in, icons |
| `src/components/elementor/` | Renderer for the migrated inner pages (see below) |
| `src/content/pages/*.json`, `src/content/posts/*.json` | Content of every inner page / post (generated from the original HTML) |
| `src/data/` | Homepage text, menu, contact links, SEO data (`seo.json`), list of URLs |
| `src/styles/variables.css` | Brand colours, fonts, container width |
| `src/styles/elementor/` | Original Elementor/theme CSS, converted (generated) |
| `public/images/uploads/` | All original images, same paths as WordPress `wp-content/uploads/` |
| `public/icons/`, `public/fonts/` | Facility icons, theme icon font |
| `scripts/` | Checking tools (layout comparison, screenshots) and `scripts/migration/` (generators) |
| `docs/` | Audit, design/SEO notes, migration checklist, **HANDOFF.md** |

## How the inner pages work

The 55 inner pages were built with Elementor. Instead of rewriting each one by hand, they are rendered from data:

1. `scripts/migration/extract_pages.py` / `extract_posts.py` read the original HTML (`docs/audit/source-html/`) and write `src/content/pages|posts/*.json` — a tree of containers and widgets with cleaned HTML.
2. `scripts/migration/convert-css.mjs` copies the original CSS (`docs/audit/original-css/`) to `src/styles/elementor/`, rewriting image URLs and font names.
3. `scripts/migration/generate-routes.mjs` writes one `src/app/<url>/page.tsx` per page.
4. `ElementorPage` / `PostPage` render the JSON with the original class names and CSS IDs, so the original CSS applies unchanged.
   The site's WordPress "Additional CSS" is in `src/styles/elementor/wp-custom-css.css`.
   `ElementorBehaviors` re-creates what Elementor's JavaScript did: tabs, accordions, fade-in animations, parallax, lightbox, testimonial sliders.

## Inner-page redesign ("Logbook")

On top of the migrated pages sits a redesign layer (design system and rules: `MASTER.md`):

| Path | What |
|---|---|
| `src/styles/redesign/tokens.css`, `inner-pages.css` | All redesign styles, scoped under `#mocean-page` |
| `src/components/elementor/Facts.tsx`, `src/data/facts.json` | Facts bar under the hero and dive-site spec rows (figures from each page's own text only) |
| `src/components/elementor/faqPanel.ts` | FAQ index + answer panel on screens ≥1025px |
| `src/components/elementor/PageNav.tsx` | Sticky in-page jump-nav and back-to-top |
| `src/data/heading-roles.json` | Which heading line leads on each page (`scripts/migration/heading-roles.mjs`) |

Add `?original` to any URL to see the original design, e.g. `http://localhost:3000/pricing/?original`.

**To change text on an inner page:** edit its JSON file in `src/content/pages/` (search for the text).
**To change the homepage:** edit `src/data/homepage.ts` (text) or `src/components/home/` (layout).

Regenerating everything (only needed if the source HTML/CSS is re-downloaded):

```bash
pip install beautifulsoup4 lxml
python scripts/migration/extract_pages.py docs/audit/source-html src/content/pages
python scripts/migration/extract_posts.py docs/audit/source-html src/content/posts
rm src/content/pages/home.json          # the homepage is hand-built
node scripts/migration/convert-css.mjs
node scripts/migration/heading-roles.mjs
node scripts/migration/generate-routes.mjs
```

## Checking against the live site

Uses the Microsoft Edge installed on Windows (no browser download).

```bash
npx tsx scripts/compare-layout.ts /pricing/ 1440     # element positions, live vs local ?original (needs npm run dev)
bash scripts/compare-all.sh 1440 390                  # all pages → docs/compare/summary.txt
npx tsx scripts/check-home.ts                         # homepage interactions
npx tsx scripts/check-inner.ts /accommodation/        # inner page interactions
npx tsx scripts/check-links.ts                        # broken internal links, anchors and images
```

In Git Bash prefix path arguments with `MSYS_NO_PATHCONV=1` (otherwise `/` becomes a Windows path).
If the dev server is not on port 3000, set `LOCAL_URL`, e.g. `LOCAL_URL=http://localhost:3001`.

## Environment

Variables are listed in `.env.example` (copy to `.env.local` locally; on Vercel: Project Settings → Environment Variables).

- `SITE_ENV=production` or `VERCEL_ENV=production` → the site may be indexed and Ahrefs analytics loads. Anything else (local, Vercel preview) is `noindex`.
- **Contact form** (`/contact/` → `src/app/api/contact/route.ts`, browser side `src/components/elementor/contactForm.ts`) sends through **SendGrid**: `SENDGRID_API_KEY` (permission "Mail Send"), `CONTACT_TO_EMAIL` (comma-separated), `CONTACT_FROM_EMAIL` (verified in SendGrid), optional `CONTACT_FROM_NAME`. Without them `npm run dev` prints the message to the terminal instead; production answers with an error.
- **Cloudflare cache purge** after every successful production deployment: `.github/workflows/purge-cloudflare.yml` (triggered by Vercel's GitHub deployment status) runs `scripts/purge-cloudflare.ts`. Needs the GitHub repository secrets `CLOUDFLARE_API_TOKEN` (permission Zone → Cache Purge) and `CLOUDFLARE_ZONE_ID`. By hand: `npx tsx scripts/purge-cloudflare.ts` (`--dry-run`, `--everything`), or "Run workflow" in the GitHub Actions tab.
