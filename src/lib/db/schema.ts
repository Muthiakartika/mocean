import { index, integer, jsonb, pgTable, serial, text, timestamp, uuid, boolean, date, customType } from "drizzle-orm/pg-core";

/** Raw bytes (Postgres `bytea`). postgres.js reads them as a Buffer, PGlite as a Uint8Array: both become a Buffer. */
const bytea = customType<{ data: Buffer; driverData: Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (value) => Buffer.from(value),
  toDriver: (value) => value,
});

/**
 * Tables of the resort's own booking system (src/lib/booking/native/).
 *
 * Dates are calendar days (type `date`, read and written as "YYYY-MM-DD" strings): the resort works in one time zone and
 * a stay has no time of day. Ranges are half-open: `ends_on` / `check_out` is the first day NOT covered, so a guest who
 * leaves on the 13th and one who arrives on the 13th never overlap.
 * Money is whole rupiah (integer), tax and service included, like the prices on the website.
 */

/** A kind of room (e.g. "Deluxe King Bungalow") and how many of them the resort has. */
export const roomTypes = pgTable("room_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  maxGuests: integer("max_guests").notNull(),
  /** How many rooms of this type exist. */
  units: integer("units").notNull(),
  photos: jsonb("photos").$type<string[]>().notNull().default([]),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  /** Price per night, per season. A date that is in no season range is low season. */
  priceLow: integer("price_low").notNull(),
  priceShoulder: integer("price_shoulder").notNull(),
  priceHigh: integer("price_high").notNull(),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

/** Dates of the shoulder and high seasons. Everything else is low season. */
export const seasonRanges = pgTable("season_ranges", {
  id: serial("id").primaryKey(),
  season: text("season").$type<"shoulder" | "high">().notNull(),
  startsOn: date("starts_on", { mode: "string" }).notNull(),
  /** First day after the season. */
  endsOn: date("ends_on", { mode: "string" }).notNull(),
  label: text("label").notNull().default(""),
});

/** Rooms taken out of sale for some dates (repairs, owner use, sold elsewhere). */
export const blocks = pgTable(
  "blocks",
  {
    id: serial("id").primaryKey(),
    roomTypeId: text("room_type_id")
      .notNull()
      .references(() => roomTypes.id),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    /** First day the rooms are on sale again. */
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    /** How many rooms of the type are blocked. */
    units: integer("units").notNull().default(1),
    reason: text("reason").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("blocks_room_type_idx").on(table.roomTypeId)],
);

/** Extras guests can add to a booking (airport transfers). */
export const addOns = pgTable("add_ons", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

/** Single values the owner can change (tax rate, long-stay discount, hold time). See src/lib/booking/native/settings.ts. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** What the guest quotes, e.g. "MOC-7K2P9X". */
    code: text("code").notNull().unique(),
    /**
     * pending: asked, not yet confirmed by the resort; holds its rooms until `expires_at`.
     * confirmed: holds its rooms. cancelled: holds nothing.
     */
    status: text("status").$type<ReservationStatus>().notNull().default("pending"),
    checkIn: date("check_in", { mode: "string" }).notNull(),
    checkOut: date("check_out", { mode: "string" }).notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    country: text("country").notNull().default(""),
    zip: text("zip").notNull().default(""),
    arrivalTime: text("arrival_time").notNull().default(""),
    /** Requests written by the guest. */
    notes: text("notes").notNull().default(""),
    /** Written by the resort's staff, never shown to the guest. */
    adminNotes: text("admin_notes").notNull().default(""),
    total: integer("total").notNull(),
    deposit: integer("deposit").notNull().default(0),
    /** "web" (the booking page) or "admin" (entered by staff, e.g. from a WhatsApp chat). */
    source: text("source").$type<"web" | "admin">().notNull().default("web"),
    /** The booking page's attempt id: a retry of the same attempt finds this row instead of making a second one. */
    requestId: text("request_id").unique(),
    /** A pending reservation stops holding its rooms at this time. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    /**
     * The guest asked to cancel a confirmed booking on "Manage my booking" (/book/manage/). Staff decide, because a
     * deposit may have to be refunded; the booking keeps its rooms until staff cancel it.
     */
    cancelRequestedAt: timestamp("cancel_requested_at", { withTimezone: true }),
    cancelRequestNote: text("cancel_request_note").notNull().default(""),
  },
  (table) => [index("reservations_dates_idx").on(table.checkIn, table.checkOut), index("reservations_status_idx").on(table.status)],
);

/** One row per room of a reservation (a booking can have several, of the same or different types). */
export const reservationRooms = pgTable(
  "reservation_rooms",
  {
    id: serial("id").primaryKey(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    roomTypeId: text("room_type_id")
      .notNull()
      .references(() => roomTypes.id),
    /** Name of the rate when booked, e.g. "Standard Rate". */
    rateName: text("rate_name").notNull(),
    adults: integer("adults").notNull(),
    children: integer("children").notNull().default(0),
    total: integer("total").notNull(),
    nightly: jsonb("nightly").$type<{ date: string; rate: number }[]>().notNull(),
  },
  (table) => [index("reservation_rooms_reservation_idx").on(table.reservationId), index("reservation_rooms_type_idx").on(table.roomTypeId)],
);

export const reservationAddOns = pgTable(
  "reservation_add_ons",
  {
    id: serial("id").primaryKey(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    /** Name and price are copied, so a later price change does not rewrite old bookings. */
    name: text("name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
  },
  (table) => [index("reservation_add_ons_reservation_idx").on(table.reservationId)],
);

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  /** scrypt, see src/lib/admin/password.ts */
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Photos uploaded in the admin (room types). Kept in the database so they work on any host without a file store; the
 * admin shrinks them in the browser before upload (long side 1920px, JPEG), so each is a few hundred KB. Served by
 * src/app/media/[id]/route.ts at /media/<id>/, the address stored in room_types.photos.
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: text("content_type").notNull(),
  bytes: bytea("bytes").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PaymentMethod = "bank" | "cash" | "card" | "xendit" | "other";
/** pending: an online payment page is open and not paid yet. paid: money received. expired / failed: never paid. */
export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

/**
 * Money received for a reservation, or asked for online (src/lib/booking/native/payments.ts). Staff record bank
 * transfers and cash in the admin; a Xendit payment page is a row here from the moment it is opened, and becomes "paid"
 * when Xendit reports it.
 */
export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    method: text("method").$type<PaymentMethod>().notNull(),
    status: text("status").$type<PaymentStatus>().notNull().default("paid"),
    /** Our id sent to the payment provider (Xendit external_id). */
    reference: text("reference").unique(),
    /** The provider's id (Xendit invoice id). */
    providerId: text("provider_id"),
    /** The provider's payment page. */
    checkoutUrl: text("checkout_url"),
    /** How the guest paid, as the provider reports it (e.g. "BANK_TRANSFER"). */
    channel: text("channel").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("payments_reservation_idx").on(table.reservationId)],
);

export type RoomType = typeof roomTypes.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type SeasonRangeRow = typeof seasonRanges.$inferSelect;
export type BlockRow = typeof blocks.$inferSelect;
export type AddOnRow = typeof addOns.$inferSelect;
export type ReservationRow = typeof reservations.$inferSelect;
export type ReservationRoomRow = typeof reservationRooms.$inferSelect;
