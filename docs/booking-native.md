# Own booking system (database + admin)

The resort's own booking system: rooms, prices, availability and reservations live in the resort's database, and staff
manage them in `/admin/`. It plugs into the same `/book/` page as the Cloudbeds version (see `booking-engine.md`)
through the `BookingProvider` interface (`src/lib/booking/server.ts`); the guest-facing pages are unchanged.

Status (2026-11-13): built and tested on a local database. Not yet connected to a real Postgres, no real email sent,
the site's "Book Now" buttons still open Cloudbeds. The owner keeps Cloudbeds as the booking engine until its paid year
ends (around March/April 2027) and may try this system beside it first (see "Trial version"); Cloudbeds stays the source
of truth for the calendar until the owner approves the switch (see "Going live").

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
still ahead are a light navy with a navy top edge: what is booked so far. Booking value is what the bookings are worth,
not money received (that is on Payments). Code: `src/lib/booking/native/reports.ts`, `src/app/admin/charts.tsx`.

## Calendar (2026-11-13)

`/admin/calendar/`: who stays where. One row per room of each type, each stay a bar with the guest's name from the
check-in night to the last night before check-out, like the Cloudbeds calendar; two or four weeks, Earlier / Today /
Later, or a date. Navy: confirmed. Amber: a request waiting for staff. Grey: blocked. A red mark: the guest asked to
cancel. A bar opens its booking. The rows ("Room 1, 2…") are drawn by `assignLanes` (`engine.ts`): the system counts
rooms per type and does not assign a room to a stay, so they are not room numbers. Code: `calendarLanes` in `store.ts`.

## Prices and seasons (2026-11-13)

`/admin/rates/` ("Prices" in the menu), made for the owner, who sets prices by season:

- **Price per night**: one table, a row per room type and a column per season (low, shoulder, high), saved at once
  (`savePricesAction`). Amounts can be typed with or without separators.
- **Seasons in a year**: a bar of the whole year coloured by season (`seasonRuns` in `engine.ts`), the nights per season,
  the high and shoulder ranges of that year (add, remove), and Earlier / Later years. "Copy 2026's dates to 2027" copies
  the ranges that start in a year to the same dates a year later (`copySeasonsToNextYear` in `admin-store.ts`), only
  while the next year has none; holidays that move (Easter, Lunar New Year) are then adjusted by hand.
- Long-stay discount, tax inside the prices, holding time, auto-confirm (unchanged).

## Room photos and details (2026-11-13)

`/admin/rooms/` ("Rooms"): each room type opens to its photos (add several at once, make one the cover, remove), name,
description, features (one per line), number of rooms and most guests; the extras (transfers) are below. Prices are on
`/admin/rates/`. Photos are shrunk in the browser (long side 1920px, JPEG) and stored in the database (`media` table),
served at `/media/<id>/` with a one-year cache (`src/app/media/[id]/route.ts`, `src/lib/booking/native/media.ts`). The
server checks the file's first bytes (JPEG, PNG or WebP only) and allows 4 MB; Next's server action limit is set to 5 MB
in `next.config.ts`. An uploaded photo is deleted when no room shows it any more; the site's own images never are.

## Payments (2026-11-13)

`/admin/payments/` (code: `src/lib/booking/native/payment-settings.ts`, `payments.ts`, `src/lib/payments/xendit.ts`):

- **Deposit rule**: the first night of each room (as before), a percentage of the total, or the whole stay. It is part of
  the price the booking page shows and the server checks (`depositPolicy` in the availability, `buildQuote`); bookings
  already made keep their deposit.
- **Bank transfer**: bank, account name and number, a note. Shown on the guest's booking page and in the emails, with
  the booking number as the reference. Staff record the transfer on the booking (Payments > Record a payment received),
  which can confirm the booking and email the guest a receipt. A payment entered by mistake can be removed.
- **Online (Xendit)**: with `XENDIT_SECRET_KEY` and `XENDIT_CALLBACK_TOKEN` set and the switch on, the guest's booking
  page has "Pay online": it opens a Xendit payment page (an Invoice) for what is due, reused if pressed twice. Xendit
  calls `/api/payments/xendit/` when it is paid or expires; the call must carry the verification token, and a "paid"
  call is believed only after the invoice is read back from Xendit's API. The payment is then recorded once and a
  waiting request is confirmed (if its room is still free; otherwise the resort is emailed what to do).
- Emails: the request mail and the confirmation say how to pay the deposit when a way is set up; a receipt goes to the
  guest and a notice to the resort when money comes in.

Not confirmed, try before going live: the JSON field names come from Xendit's official Node SDK because Xendit's own
invoice reference pages did not load; the unit of `invoice_duration` is taken as seconds (the SDK's example). Make a
test payment with a test key from start to end (the page, paying, the callback, the booking confirmed, the emails).
Not built: refunds (done in Xendit's dashboard or by transfer, then noted on the booking), card details kept by the
site (never: Xendit's page takes them), several currencies.

## Guide for staff (2026-11-13)

`/admin/guide/` ("Guide"): the everyday jobs in a few steps each (prices by season, answering a request, a booking from
WhatsApp, recording a payment, the calendar, blocking rooms, a guest asking to cancel, room photos), each with a link to
its page. Its words follow the buttons and headings of those pages: change them together.

## Trial version (2026-11-13)

The owner keeps Cloudbeds as the booking engine until its paid year ends (around March/April 2027) and may run this
system beside it to try it. A trial deployment runs with two more variables (`src/lib/booking/native/trial.ts`):

- `BOOKING_TRIAL=1`: the admin shows a "Trial" line (bookings here are not real, guests still book on Cloudbeds, where
  emails go); `/book/` and `/book/manage/` say "Trial version" under the title with a link to the Cloudbeds page; the
  Guide starts with **sample bookings**.
- `BOOKING_TRIAL_EMAIL`: every email the system writes goes only there, its subject starting "[Trial]" and its first
  line naming who would have received it (`sendMail` in `src/lib/mail.ts`). Not set: no email is sent at all.

Sample bookings (`src/lib/booking/native/samples.ts`, buttons on the Guide, trial only): fifteen made-up guests at
example.com addresses around today, made through the normal booking code with the current prices: past stays (for
Reports), guests in the resort, arriving and leaving today, two requests waiting, a confirmed booking whose guest asks to
cancel, a cancelled booking, an expired request, bookings entered by staff, payments, and one block. They are marked by
a request id starting with `sample-` (the block by its reason), and "Remove sample bookings" deletes exactly those with
their payments; bookings, prices, seasons and rooms entered by hand stay. A sample whose room is already taken is skipped.

Set the trial up as its own deployment with its **own database** (never the live one), and never set `BOOKING_TRIAL` on the
live site. On Vercel: the variables of the branch's Preview environment (Settings > Environment Variables, Preview, the
branch), and a Neon database of its own. The "Book Now" buttons of the site are not changed by any of this.

## Not built (on purpose, decide with the owner)

- **Refunds and payment reports.** Money in is recorded per booking and listed on Payments; refunds are made outside
  the site.
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
| What the system knows about this property (name, currency, time zone, booking number prefix, texts, starting settings) | `src/config/property.ts` |
| Starting rooms and extras of this property | `src/config/property-rooms.ts` |
| Tables | `src/lib/db/schema.ts`, SQL in `drizzle/` |
| Database connection (Postgres or local PGlite), putting in the starting data | `src/lib/db/index.ts`, `seed.ts`, `dev-admin.ts` |
| Rules: nights, seasons, prices, free rooms (pure, no database) | `src/lib/booking/native/engine.ts` |
| Queries and writes: availability, create/confirm/cancel, lists, calendar | `src/lib/booking/native/store.ts` |
| Settings with defaults | `src/lib/booking/native/settings.ts` |
| `BookingProvider` for /book/ | `src/lib/booking/native/provider.ts` |
| Emails (SendGrid) | `src/lib/mail.ts`, `src/lib/booking/native/emails.ts` |
| Admin login (signed cookie, scrypt) | `src/lib/admin/session.ts`, `password.ts` |
| Admin pages and actions | `src/app/admin/` (`actions.ts` holds every action; each one checks the login) |
| Scripts | `scripts/db-setup.ts`, `scripts/admin-create.ts` |
| Tests | `tests/` |

## Using it for another property (2026-11-13)

The booking code no longer names this property. What it says or assumes about Mocean is in two files, and those are
what change for another property:

- `src/config/property.ts`: name, region, currency, time zone, booking number prefix (`MOC`), WhatsApp link, the other
  place to book (Cloudbeds), logo and photo, example texts in the forms, starting settings (tax, long-stay discount,
  holding time). The `PropertyConfig` type in that file documents every value.
- `src/config/property-rooms.ts`: the room types and extras an empty database starts with.

Not done yet. Before the code can move to its own folder or package and serve several sites, these still tie it here:

- **Design.** `/book/` and `/book/manage/` use this site's Waves styles and wave shape (`src/styles/redesign/`,
  `src/components/home/Wave`, `Booking.module.css`) and sit inside the site's header and footer. The admin's colours
  are fixed in `src/app/admin/admin.css`.
- **One property per database.** No table has a property column: every property needs its own database and its own
  deployment. One shared service for many properties is a different, larger design.
- **Whole-amount currencies only.** Prices are stored and shown without cents (fine for IDR, not for USD or EUR).
- **Wording.** English only, and the texts say "resort" (emails, admin).
- **Cloudbeds parts.** `src/lib/cloudbeds/`, the sample rooms in `src/lib/booking/demo.ts` (copied from Mocean's
  Cloudbeds page) and the demo-mode texts in `BookingApp.tsx`.
- **Tests** take their rooms, unit counts and prices from `property-rooms.ts` (`tests/booking-store.test.ts`); a shared
  package needs its own test data.
- **Small things.** `property.ts` reads the WhatsApp and Cloudbeds links from the site's `src/data/contact.ts`. The
  local test login (`DEV_ADMIN` in `src/lib/db/dev-admin.ts`) keeps its Mocean name so existing local databases still
  open.

## Known limits

- The last-room lock (`FOR UPDATE`) is tested on PGlite, which has one connection, so the tests prove the logic and
  the order of the steps but not real parallel connections. Run the two-browser test against Neon before going live.
- The login attempt limit and the booking rate limit are kept in memory per server instance (like the existing
  booking routes): they slow a script down, they do not stop a distributed one.
- No screenshots of `/admin/` were checked on phone widths yet; the layout is plain and wraps, but look at it.
