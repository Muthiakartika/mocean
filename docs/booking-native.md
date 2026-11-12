# Own booking system (database + admin)

The resort's own booking system: rooms, prices, availability and reservations live in the resort's database, and staff
manage them in `/admin/`. It plugs into the same `/book/` page as the Cloudbeds version (see `booking-engine.md`)
through the `BookingProvider` interface (`src/lib/booking/server.ts`); the guest-facing pages are unchanged.

Status (2026-11-12): built and tested on a local database. Not yet connected to a real Postgres, no real email sent,
the site's "Book Now" buttons still open Cloudbeds. Cloudbeds stays the source of truth for the calendar until the
owner approves the switch (see "Going live").

## What it does

- Guests: search dates, choose rooms, extras (transfers), details, confirmation, in the existing `/book/` design.
- A website booking is a **request**: it holds its rooms for 24 hours (changeable) until staff confirm it in the admin,
  then the guest is emailed. A setting turns on **auto-confirm**. A request that is not answered in time stops holding
  its rooms (nothing is deleted; the admin shows it as "expired").
- Admin (`/admin/`): today's requests and arrivals, bookings list and detail (confirm, cancel, staff notes), new booking
  entered by staff (e.g. from WhatsApp, with an optional staff price), calendar per room type, blocked dates, room
  types and prices, season dates, long-stay discount, tax rate, holding time, extras.
- Prices: per room type, per night, three seasons (low, shoulder, high). Dates in no season range are low season. The
  "Extended Stay" rate (a percentage off every night from N nights) is built from the settings.
- Double booking: a booking is checked and saved in one transaction that locks the chosen room types first, so two
  guests asking for the last room line up and the second is refused ("we've refreshed the rooms for you").

## Guests: manage, cancel, write to the resort (2026-11-12)

- `/book/manage/`: the guest finds a booking with its number and email, or opens the link that every booking email
  carries (and the booking page's last step). The link is the number plus a signature of the number and email
  (`src/lib/booking/native/guest-link.ts`, `BOOKING_LINK_SECRET`), so nobody can open someone else's booking by guessing.
- Cancelling: a **request** (not confirmed, nothing paid) the guest cancels at once; the guest and the resort are emailed.
  A **confirmed** booking the guest can only **ask** to cancel (with a note): staff settle the deposit and cancel it in the
  admin. Until then it keeps its rooms. The admin shows these on Today ("Guests asking to cancel"), in the bookings list
  ("Asked to cancel") and at the top of the booking.
- Contact: WhatsApp with the booking number already typed, or a message form that emails the resort (answering the email
  writes to the guest). Changes of dates or rooms go through these; staff make them in the admin.
- Lookups and messages are limited per IP against guessing and spam.

## Admin reports (2026-11-12)

`/admin/reports/`: twelve months (the last six and the next six by default, with Earlier / Later): guests arriving,
booking value, average stay, room nights booked; charts of guests (with the monthly average), booking value and
occupancy per month; room nights per room type; where guests come from; the same figures as a table. Only **confirmed**
bookings count. Guests and value count in the month the guests arrive, room nights in the month they are slept. Months
still ahead are hatched: what is booked so far. Booking value is what the bookings are worth, not money received (the
site takes no payments yet). Code: `src/lib/booking/native/reports.ts`, `src/app/admin/charts.tsx`.

## Not built (on purpose, decide with the owner)

- **Online payment.** A booking is a request; staff arrange the deposit by email/WhatsApp. Planned as a separate module with
  a provider switch (Xendit or Midtrans for IDR, Stripe if it is open to the company, or manual). Nothing in the
  tables needs to change for it except a `payments` table.
- **OTA sync (Booking.com, Expedia, Airbnb, Agoda).** This system cannot connect to them directly: Booking.com and
  Expedia only open their connection APIs to certified connectivity partners (channel managers and PMS vendors; Booking.com
  has reportedly paused onboarding of new partners, Expedia decides eligibility case by case). Researched on 2026-11-12
  from secondary sources (listed below): verify with each OTA before relying on any of it. If the rooms are also sold on
  OTAs, the realistic options are:
  1. **Keep Cloudbeds as the channel manager** (and the calendar's source of truth). `/book/` then runs on the Cloudbeds
     API provider (`booking-engine.md`), not on this database.
  2. **Connect this system to a channel-manager API** built for PMS developers (Channex, Beds24 and similar), which does
     the OTA certification and sync. Needs a monthly fee and an integration of its own (rates, availability and
     incoming reservations both ways); check their current price and which Booking.com / Expedia features they support.
  3. **iCal** is NOT a safe assumption: the Booking.com sync is reported to be limited (for example, one unit per room
     type), which would exclude types with several rooms like Deluxe King (4); it is also slow (30 minutes to hours) and
     carries no prices. Check "Sync calendars" in the property's Booking.com extranet before considering it. Expedia's
     iCal is for vacation rentals.
  Until this is decided, do not switch the buttons.
  Sources: [Booking.com connectivity partners (vendor summary)](https://hospitable.com/booking-com-connectivity-partners),
  [Expedia Group Connectivity Partner Program](https://developers.expediagroup.com/supply/lodging/cpp/overview),
  [Channex pricing](https://channex.io/pricing) and [Channex FAQ](https://docs.channex.io/about-channex-and-faq).
  The iCal limits come from third-party vendor reports and were not found in Booking.com's own documentation: confirm
  them in the extranet.
- Choosing the exact room (like "DLX KING 4"): the system counts rooms per type.
- Promo codes, taxes added on top of prices, several currencies.
- Admin users management screen (use the script below), password change screen.

## Run it locally

```bash
BOOKING_PROVIDER=native npm run dev
```

(PowerShell: `$env:BOOKING_PROVIDER="native"; npm run dev`.) Without `DATABASE_URL` a test Postgres (PGlite) is created in
`node_modules/.cache/mocean-pglite` on first use, with the room types and transfers already in it. Open
`http://localhost:3012/book/` and `http://localhost:3012/admin/`; the local admin login is `DEV_ADMIN` in
`src/lib/db/dev-admin.ts` (exists only in that local database). Delete the folder to start over.

Careful: `.env.local` may hold the real SendGrid key. Mails go out for real when it is set; to try the flow without
sending, run with `SENDGRID_API_KEY=` empty (in development the mail is printed to the server log instead).

Tests (`tests/`, 34 of them: dates, seasons, prices, last-room, expiry, blocks, calendar):

```bash
npm test
```

## Going live

1. Create a Postgres: Vercel project > Storage > Neon (adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`).
2. Locally, with those two in `.env.local`: `npm run db:setup` (creates the tables, adds the starting data).
3. `npm run admin:create -- owner@example.com` creates the owner's login and prints the password once.
4. Vercel environment variables: `BOOKING_PROVIDER=native`, `ADMIN_SESSION_SECRET` (random, 32+ characters),
   `BOOKING_LINK_SECRET` (random, 32+ characters, for the guests' booking links), `BOOKING_SITE_URL` (optional),
   `BOOKING_TO_EMAIL` (optional; default `CONTACT_TO_EMAIL`). SendGrid is already set for the contact form.
5. Sign in at `/admin/` > Rooms and rates: **enter the season dates** and check every number listed below.
6. Test on a preview deployment: a search, a booking, confirm it, cancel it. Test two browsers asking for the last room.
7. Only then point the "Book Now" buttons to `/book/` (header, hero, floating button, menu; most are in
   `src/content/pages/*.json`) and decide what happens to the Cloudbeds calendar.

Changing the database structure: edit `src/lib/db/schema.ts`, run `npm run db:generate`, commit the new SQL in `drizzle/`,
run `npm run db:setup` against each database.

## To confirm with the owner (starting data, all editable in the admin)

| What | Starting value | Where it came from |
|---|---|---|
| Rooms per type | Deluxe King 4, Deluxe Queen 1, Deluxe Twin 1, Standard King 2, Standard Twin 2 (10 rooms) | Cloudbeds page, 2026-11-11 |
| Guests per room | Deluxe 2, Standard 3 | Website text. The Cloudbeds page offers 3 for every type: which is right? |
| Prices per night (IDR) | Deluxe 2,200,000 / 2,337,500 / 2,800,000; Standard 1,690,000 / 1,785,000 / 2,150,000 (low / shoulder / high) | Website `roomRates` |
| Season dates | **None. Everything is priced as low season until they are entered.** | Not published anywhere |
| Long-stay discount | 5% from 3 nights | Cloudbeds page, 2026-11-11 (the website only says "a discount") |
| Tax and service inside prices | 22.1% | Cloudbeds page, 2026-11-11 |
| Deposit | The first night of each room (same as the Cloudbeds version) | `buildQuote` in `src/lib/booking/stay.ts` |
| Holding time of a request | 24 hours | Chosen here |
| Booking notices go to | `BOOKING_TO_EMAIL`, else `CONTACT_TO_EMAIL` | Open question in PRODUCT.md: which booking address |
| Wording of the emails | `src/lib/booking/native/emails.ts` | Written here: owner should read it (it says staff will arrange the deposit) |
| Privacy | Guest names, emails and phones are stored. A privacy/terms page for bookings is needed | Not written |

## Code

| Part | File |
|---|---|
| Tables | `src/lib/db/schema.ts`, SQL in `drizzle/` |
| Database connection (Postgres or local PGlite), starting data | `src/lib/db/index.ts`, `seed.ts`, `dev-admin.ts` |
| Rules: nights, seasons, prices, free rooms (pure, no database) | `src/lib/booking/native/engine.ts` |
| Queries and writes: availability, create/confirm/cancel, lists, calendar | `src/lib/booking/native/store.ts` |
| Settings with defaults | `src/lib/booking/native/settings.ts` |
| `BookingProvider` for /book/ | `src/lib/booking/native/provider.ts` |
| Emails (SendGrid) | `src/lib/mail.ts`, `src/lib/booking/native/emails.ts` |
| Admin login (signed cookie, scrypt) | `src/lib/admin/session.ts`, `password.ts` |
| Admin pages and actions | `src/app/admin/` (`actions.ts` holds every action; each one checks the login) |
| Scripts | `scripts/db-setup.ts`, `scripts/admin-create.ts` |
| Tests | `tests/` |

## Known limits

- The last-room lock (`FOR UPDATE`) is tested on PGlite, which has one connection, so the tests prove the logic and
  the order of the steps but not real parallel connections. Run the two-browser test against Neon before going live.
- The login attempt limit and the booking rate limit are kept in memory per server instance (like the existing
  booking routes): they slow a script down, they do not stop a distributed one.
- No screenshots of `/admin/` were checked on phone widths yet; the layout is plain and wraps, but look at it.
