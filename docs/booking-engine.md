# Booking engine (/book/)

> The same page can also run on the resort's own database instead of Cloudbeds: see `booking-native.md`
> (`BOOKING_PROVIDER=native`). This document describes the Cloudbeds API version.

The site's own booking page, in the site's design, working on the resort's Cloudbeds data through the official
Cloudbeds API (v1.3). It replaces the look of Cloudbeds' hosted page (https://us2.cloudbeds.com/en/reservation/yPrE1K),
not Cloudbeds itself: rooms, prices, availability and reservations stay in Cloudbeds.

Status (2026-11-11): built and tested end to end in demo mode (sample rooms and prices, nothing reserved), which is what
local development and Vercel preview deployments show until a Cloudbeds API key is set. Not yet run against the live API (no key yet), and the
site's "Book Now" buttons still open Cloudbeds' page.

## Flow

Same steps as the Cloudbeds page (checked 2026-11-11):

1. Search: dates (two-month calendar), adults/children, optional promo code. The search is in the URL with Cloudbeds'
   parameter names, so links work the same: `/book/?checkin=2026-12-10&checkout=2026-12-13&adults=2&children=0`.
2. Rooms: each room type with its rates for the stay ("Standard Rate", "Extended Stay - Three Nights or More"), saving
   against the standard rate, "Only N left". Several rooms per booking, guests per room.
3. Extras: transfers etc. (skipped when none are set up).
4. Your details: name, email, phone, country, postal code, arrival time, requests.
5. Confirmation: Cloudbeds booking number, total, deposit.

Not copied from Cloudbeds: choosing the exact unit (DLX KING 1/4/5/6). Cloudbeds assigns the room.

## Code

| Part | File |
|---|---|
| Page | `src/app/book/page.tsx`, `src/app/book/book.css` |
| UI | `src/components/booking/` (`BookingApp.tsx` runs the steps; `Booking.module.css`, Waves tokens) |
| Shared logic: dates, pricing, validation | `src/lib/booking/stay.ts`, `types.ts` |
| Provider choice, rate limit | `src/lib/booking/server.ts` |
| Demo data (copied from the Cloudbeds page) | `src/lib/booking/demo.ts` |
| Cloudbeds API | `src/lib/cloudbeds/client.ts`, `provider.ts` |
| API routes | `src/app/api/booking/availability/route.ts` (GET), `src/app/api/booking/reserve/route.ts` (POST) |

The browser never talks to Cloudbeds; the key stays on the server. The reserve route searches again, prices the request
itself and refuses it if the total differs from what the guest saw, if a room ran out, or if the request comes from
another site. A repeated request id (double click, retry) returns the first answer instead of a second reservation.

## Cloudbeds calls

| Step | Endpoint | Cached |
|---|---|---|
| Room names, descriptions, photos, max guests | `getRoomTypes` | 10 min |
| Rates and availability for the stay | `getRatePlans` (`detailedRates=true`; skips rates with no room free, blocked nights, closed to arrival/departure, outside min/max stay) | no |
| Currency | `getHotelDetails` | 1 h |
| Tax and service in the prices | `getTaxesAndFees` (inclusive percentages, compounded) | 10 min |
| Extras | `getItems` (only the IDs in `CLOUDBEDS_ADDON_ITEM_IDS`) | 10 min |
| Booking | `postReservation`, then `postReservationNote` (requests), `postItem` (extras), `getReservation` (final total and Cloudbeds' suggested deposit) | |

Cloudbeds allows about 5 requests a second per property and may block the IP after repeated bursts, hence the caches
and a per-IP limit on the routes.

## Going live

1. In Cloudbeds: Account > Apps & Marketplace > API Credentials > New Credentials, then Create API key. An
   administrator with the "API and Integration" permission. Scopes: `read:hotel`, `read:room`, `read:rate`,
   `read:item`, `write:item`, `read:taxesAndFees`, `read:reservation`, `write:reservation` (and `read:payment`,
   `write:payment` if the site will record deposits). The key is shown once. If the plan does not include API access,
   the page offers an access form instead.
2. Vercel > Project Settings > Environment Variables: `CLOUDBEDS_API_KEY`, `CLOUDBEDS_PROPERTY_ID`, and
   `CLOUDBEDS_ADDON_ITEM_IDS` for the transfers. Others: `.env.example`.
3. Test on a preview deployment with a few searches, compare with the Cloudbeds page, make one booking and cancel it
   in Cloudbeds. Ask integrations@cloudbeds.com for a test property if one should be used instead.
4. Point the "Book Now" buttons (header, hero, floating button, menu) to `/book/` once approved.

## Open questions

- **Cloudbeds terms.** Section 4.4 of the Cloudbeds developer terms bars using the API to "substantially replicate or
  compete with" Cloudbeds products. The terms are written for partners; Cloudbeds' property API page mentions booking
  engine integrations. Confirm with integrations@cloudbeds.com before launch.
- **Deposit / payment.** The Cloudbeds page takes the deposit by card. Reservations made through the API do not get
  Cloudbeds' deposit rules or a payment step; the site currently creates the reservation without taking money
  (`paymentMethod` from `CLOUDBEDS_PAYMENT_METHOD`, default `cash`) and shows the deposit. Options:
  - Cloudbeds Payments card form (Payment Element) + `postCharge`: needs Cloudbeds to whitelist the domain and an SDK
    key; whether a single property can use it must be confirmed with Cloudbeds.
  - Cloudbeds pay-by-link: the site creates a payment link for the deposit and sends the guest to it.
  - Another gateway (e.g. Midtrans or Xendit for IDR: cards, QRIS, virtual accounts), then `postPayment` records it.
- **Extra guest charges.** Rates are priced for the party (capped at one room's capacity); Cloudbeds prices each room's
  occupancy when booking, and the confirmation shows Cloudbeds' total.
- **Promo codes.** The Cloudbeds docs disagree on whether `postReservation` accepts `promoCode`; test with a real code.
