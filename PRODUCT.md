# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

International travellers planning a stay in West Sumbawa, Indonesia, usually coming from Bali or Lombok. For the homepage the owner weights three groups equally, with the slow-holiday visitor first in line (answer 2026-11-03: "couples / relaxed holiday" plus "all equal"):

- couples and guests who want a quiet beachfront stay (bungalows, pool on the beach, restaurant, retreats);
- divers (house reef, boat dives, PADI courses, manta and coral sites);
- surfers (Northern Rights breaks in front of the resort; Middle Reef and Dirty Hippies a short walk down the beach).

Their job on the site: decide whether this small resort fits their trip, check what it costs and how to get there, then message the resort with dates.

## Product Purpose

Marketing site of Mocean Beach Resort (PT Mocean Dive Resort), migrated from WordPress to Next.js. Success is a visitor sending their dates on WhatsApp or booking through Cloudbeds.

## Positioning

West Sumbawa's only beachfront dive and surf resort. Ten rooms on a quiet 2 km stretch of Pantai Moro: six handcrafted bungalows and four Standard Rooms, "so it never feels busy". A dive center built by divers (custom boat, individual gear lockers, camera room, training pool, PADI instruction, no more than four divers per guide) and a surf break right in front of the resort.

## Operating Context

- Getting there: ferry to Poto Tano (about 30 minutes by car) or fly to Sumbawa Besar (SWQ, about 2 hours 15 minutes); the resort picks up from both.
- Seasons: dry season May to October (most consistent surf, clearest water); dive season 1 April to 31 October; November to April greener, quieter, lower rates.
- Booking: WhatsApp +62 821 4419 1647 (primary), Cloudbeds booking engine (floating "Book" button), email. Booking direct for three nights or more gets a discount.
- Day guests: diving, and a pool day pass (IDR 300,000, 10:00 to 17:00, IDR 200,000 usable in the restaurant).

## Capabilities and Constraints

- Next.js 16 / React 19 / Tailwind 4, all routes static, deployed on Vercel. Homepage text lives in `src/data/homepage.ts`.
- The 55 inner pages are rendered from migrated Elementor data and carry the "Logbook" redesign layer (`MASTER.md`), still waiting for the owner's approval. `?original` on any URL shows the original design.
- Homepage redesign (2026-11-03): the owner asked for three options with new visual looks, not tied to Logbook; the chosen look may later be carried to the inner pages.
- No new copy and no invented numbers: figures and claims come from the site's own text. Known content errors on the original pages are listed in `docs/HANDOFF.md` and must not be repeated as facts.
- Prices are in IDR and come from `src/data/homepage.ts` / `/pricing/`.
- Open question: the correct booking email (`bookings@moceandive.com` vs `bookings@moceanbeachresort.com`).

## Brand Commitments

- Name: Mocean Beach Resort; restaurant: Mutiara by Mocean; legal line: © PT Mocean Dive Resort.
- Logo: the wave mark with "MOCEAN" (`public/images/uploads/2025/02/Mocean-FULL-Logo_White.png`, white version). PADI affiliation logo in the footer.
- Contact destinations are fixed (`src/data/contact.ts`).
- Voice: plain, direct, friendly ("Message us with your dates and we'll tell you what's free").

## Evidence on Hand

- Photography owned by the resort (`public/images/uploads/`): aerial of the bay and resort, pool, beach daybeds, bungalows and garden paths, room interiors, restaurant, gear room, dive boat, manta, reef life, surf, waterfalls, Sumbawa landscapes. Some activity photos (surf action, couples at sunset, yoga) may be stock; prefer on-site photos for claims about the place.
- Two Google reviews on the homepage (Stefan; Steven Redant). No review counts, ratings, awards or press exist; do not invent them.
- Room names, sizes, guests and seasonal prices (`roomRates` in `src/data/homepage.ts`); dive price from IDR 2,200,000 for a two-tank boat dive; FAQ answers.

## Product Principles

1. Small is the offer: ten rooms on a quiet beach is the reason to come, not a limitation to hide.
2. Dive, surf and slow days are one stay, not three products.
3. Facts the visitor plans with (price, season, how to get here) are never buried under adjectives.
4. Every path ends in a message to the resort with dates.
5. Nothing is claimed that the resort's own text does not state.
