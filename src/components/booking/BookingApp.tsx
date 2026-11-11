"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Wave from "@/components/home/Wave";
import {
  QuoteError,
  buildQuote,
  checkGuest,
  checkQuery,
  formatDay,
  formatMoney,
  queryFromParams,
  queryToParams,
  resortToday,
} from "@/lib/booking/stay";
import type { Availability, CartRoom, Guest, Quote, RateOffer, ReservationResult, RoomOffer, StayQuery } from "@/lib/booking/types";
import DateRangePicker from "./DateRangePicker";
import Extras from "./Extras";
import GuestForm from "./GuestForm";
import RoomCard from "./RoomCard";
import StaySummary from "./StaySummary";
import { GuestPicker } from "./Stepper";
import styles from "./Booking.module.css";

type Step = "rooms" | "extras" | "details" | "done";

/** The heading of the current step, focused when the step changes (screen readers hear where they are). */
const STEP_TITLE_ID = "booking-step-title";
const STEPS_ID = "booking-steps";

const STEP_LABELS: Record<Step, string> = { rooms: "Rooms", extras: "Extras", details: "Your details", done: "Confirmed" };

type Props = {
  /** Cloudbeds' own booking page, offered when the site's engine cannot answer. */
  fallbackUrl: string;
  whatsappUrl: string;
};

type SavedState = { query: StayQuery; cart: CartRoom[]; extras: Record<string, number>; guest: Guest };

const STORAGE_KEY = "mocean-booking";
const EMPTY_GUEST: Guest = { firstName: "", lastName: "", email: "", phone: "", country: "", zip: "", arrivalTime: "", notes: "" };

const sameQuery = (a: StayQuery, b: StayQuery) =>
  a.checkIn === b.checkIn && a.checkOut === b.checkOut && a.adults === b.adults && a.children === b.children && (a.promoCode ?? "") === (b.promoCode ?? "");

function newRequestId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/**
 * The site's booking engine (/book/): search, rooms and rates, extras, guest details, confirmation. Prices and
 * availability come from /api/booking/availability/ (Cloudbeds on the server); /api/booking/reserve/ prices the stay
 * again and creates the reservation. The search lives in the URL (?checkin=2026-12-10&checkout=2026-12-13&adults=2,
 * the same parameters as the Cloudbeds page), so the site can link straight to a search.
 */
export default function BookingApp({ fallbackUrl, whatsappUrl }: Props) {
  const [form, setForm] = useState<StayQuery>({ checkIn: "", checkOut: "", adults: 2, children: 0 });
  const [promoOpen, setPromoOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartRoom[]>([]);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>("rooms");
  const [guest, setGuest] = useState<Guest>(EMPTY_GUEST);
  const [guestErrors, setGuestErrors] = useState<Partial<Record<keyof Guest, string>>>({});
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<ReservationResult, { ok: true }> | null>(null);
  const requestId = useRef("");
  const searchSeq = useRef(0);

  const addOnList = useMemo(
    () => Object.entries(extras).filter(([, quantity]) => quantity > 0).map(([addOnId, quantity]) => ({ addOnId, quantity })),
    [extras],
  );

  const quote: Quote | null = useMemo(() => {
    if (!availability || cart.length === 0) return null;
    try {
      return buildQuote(availability, cart, addOnList);
    } catch (error) {
      if (error instanceof QuoteError) return null;
      throw error;
    }
  }, [availability, cart, addOnList]);

  const search = useCallback(async (query: StayQuery, restore?: SavedState | null) => {
    const problem = checkQuery(query, resortToday());
    if (problem) {
      setSearchError(problem);
      return;
    }
    const seq = ++searchSeq.current;
    setLoading(true);
    setSearchError(null);
    setStep("rooms");
    window.history.replaceState(null, "", `/book/?${queryToParams(query)}`);
    try {
      const response = await fetch(`/api/booking/availability/?${queryToParams(query)}`, { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (seq !== searchSeq.current) return;
      if (!response.ok || !data?.rooms) {
        setAvailability(null);
        setSearchError(data?.message ?? "We couldn't load the rooms just now.");
        return;
      }
      const next = data as Availability;
      setAvailability(next);
      // Keep what the guest had chosen for the same search (after a reload); a new search starts over.
      if (restore && sameQuery(restore.query, next.query)) {
        setCart(restore.cart.filter((item) => next.rooms.some((room) => room.rates.some((rate) => rate.rateId === item.rateId))));
        setExtras(restore.extras);
      } else {
        setCart([]);
        setExtras({});
      }
    } catch {
      if (seq !== searchSeq.current) return;
      setAvailability(null);
      setSearchError("We couldn't reach the booking system. Check your connection and try again.");
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }, []);

  // First load (after hydration, so the server HTML and the first client render agree): the search from the URL,
  // and what the guest had chosen before a reload.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let saved: SavedState | null = null;
      try {
        saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
      } catch {
        saved = null;
      }
      if (saved?.guest) setGuest(saved.guest);
      const query = queryFromParams(new URLSearchParams(window.location.search));
      if (query) {
        setForm(query);
        setPromoOpen(Boolean(query.promoCode));
        void search(query, saved);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [search]);

  // Keep the choices for a reload (this tab only).
  useEffect(() => {
    if (!availability || step === "done") return;
    try {
      const state: SavedState = { query: availability.query, cart, extras, guest };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode or storage blocked: the booking still works, it is just not kept over a reload.
    }
  }, [availability, cart, extras, guest, step]);

  // Browser back / forward moves between the steps.
  useEffect(() => {
    const onPop = () => {
      const target = window.location.hash.slice(1) as Step;
      if (target === "extras" || target === "details") setStep(cart.length ? target : "rooms");
      else if (target !== "done") setStep("rooms");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [cart.length]);

  const goTo = (next: Step) => {
    setStep(next);
    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#${next}`);
    requestAnimationFrame(() => {
      document.getElementById(STEP_TITLE_ID)?.focus({ preventScroll: true });
      // The step bar sits just above every step, so the back link and the step's heading both clear the sticky header.
      document.getElementById(STEPS_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  function addRoom(room: RoomOffer, rate: RateOffer) {
    if (!availability) return;
    const { adults, children } = availability.query;
    const placedAdults = cart.reduce((sum, item) => sum + item.adults, 0);
    const placedChildren = cart.reduce((sum, item) => sum + item.children, 0);
    const roomAdults = Math.max(1, Math.min(room.maxGuests, adults - placedAdults));
    const roomChildren = Math.max(0, Math.min(room.maxGuests - roomAdults, children - placedChildren));
    setCart([...cart, { roomTypeId: room.roomTypeId, rateId: rate.rateId, adults: roomAdults, children: roomChildren }]);
  }

  async function reserve() {
    if (!availability || !quote || submitting) return;
    const errors = checkGuest(guest);
    setGuestErrors(errors);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(`guest-${firstInvalid}`)?.focus();
      return;
    }
    if (!requestId.current) requestId.current = newRequestId();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/booking/reserve/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: availability.query,
          rooms: cart,
          addOns: addOnList,
          guest,
          expectedTotal: quote.total,
          requestId: requestId.current,
          website: honeypot,
        }),
      });
      const data = (await response.json().catch(() => null)) as ReservationResult | null;
      if (data?.ok) {
        setResult(data);
        requestId.current = "";
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}
        goTo("done");
        return;
      }
      requestId.current = "";
      if (data?.errors) setGuestErrors(data.errors);
      setSubmitError(data?.message ?? "The booking didn't go through. Please try again.");
      if (data?.stale) void search(availability.query);
    } catch {
      setSubmitError("We couldn't reach the booking system. Your booking was not made; check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps: Step[] = availability?.addOns.length ? ["rooms", "extras", "details", "done"] : ["rooms", "details", "done"];
  // Rooms -> extras (when there are any) -> details; the details step has its own submit button.
  const nextStep: Step | null = step === "rooms" ? (availability?.addOns.length ? "extras" : "details") : step === "extras" ? "details" : null;
  const continueAction = nextStep ? { label: "Continue", onClick: () => goTo(nextStep), disabled: !quote } : undefined;

  return (
    <div className={styles.app} id="booking-app">
      <section className={styles.hero}>
        <Image className={styles.heroImage} src="/images/uploads/2025/09/Beach-Resort-Header.jpg" alt="" fill priority sizes="100vw" />
        <div className={styles.heroInner}>
          <h1 className={styles.title}>Book your stay</h1>
          <p className={styles.lead}>Mocean Beach Resort, Pantai Moro, West Sumbawa</p>
        </div>
        <Wave edge="bottom" className={styles.heroWave} />
      </section>

      {step !== "done" && (
        <form
          className={styles.searchBar}
          onSubmit={(event) => {
            event.preventDefault();
            void search(form);
          }}
        >
          <DateRangePicker
            checkIn={form.checkIn}
            checkOut={form.checkOut}
            today={resortToday()}
            onChange={(checkIn, checkOut) => setForm({ ...form, checkIn, checkOut })}
          />
          <GuestPicker adults={form.adults} childCount={form.children} onChange={(adults, children) => setForm({ ...form, adults, children })} />
          {promoOpen ? (
            <div className={`${styles.field} ${styles.promoField}`}>
              <label className={styles.fieldPart}>
                <span className={styles.fieldLabel}>Promo code</span>
                <input
                  className={styles.promoInput}
                  value={form.promoCode ?? ""}
                  maxLength={40}
                  autoComplete="off"
                  onChange={(event) => setForm({ ...form, promoCode: event.target.value.trim() || undefined })}
                />
              </label>
            </div>
          ) : (
            <button type="button" className={styles.promoToggle} onClick={() => setPromoOpen(true)}>
              Promo code
            </button>
          )}
          <button type="submit" className={styles.searchButton} disabled={loading}>
            {loading ? "Searching" : "Search"}
          </button>
        </form>
      )}

      {availability?.source === "demo" && step !== "done" && (
        <p className={styles.demoNote} role="note">
          Demo mode: these are sample rooms and prices, and nothing is reserved. Add the Cloudbeds API key to go live.
        </p>
      )}

      {availability && (
        <ol className={styles.steps} id={STEPS_ID} aria-label="Booking steps">
          {steps.map((id, index) => (
            <li
              key={id}
              className={[
                styles.stepItem,
                id === step ? styles.stepCurrent : "",
                steps.indexOf(step) > index ? styles.stepDone : "",
              ].join(" ")}
              aria-current={id === step ? "step" : undefined}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              {STEP_LABELS[id]}
            </li>
          ))}
        </ol>
      )}

      <div className={`${styles.layout} ${availability && step !== "done" ? styles.withSummary : ""}`}>
        <div className={styles.main}>
          {searchError && (
            <div className={styles.alert} role="alert">
              <p>{searchError}</p>
              {!loading && availability === null && form.checkIn && (
                <p>
                  You can also book on <a href={fallbackUrl} rel="nofollow">our Cloudbeds page</a> or{" "}
                  <a href={whatsappUrl} target="_blank" rel="noopener">
                    message us on WhatsApp
                  </a>
                  .
                </p>
              )}
            </div>
          )}

          {!availability && !loading && !searchError && (
            <div className={styles.empty}>
              <h2 className={styles.stepTitle}>Choose your dates</h2>
              <p>Pick check-in and check-out above to see which rooms are free and what they cost. Booking direct for three nights or more gets a discount.</p>
            </div>
          )}

          {loading && (
            <div className={styles.skeletons} aria-busy="true" aria-label="Loading rooms">
              {[0, 1, 2].map((key) => (
                <div key={key} className={styles.skeleton} />
              ))}
            </div>
          )}

          {availability && !loading && step === "rooms" && (
            <>
              <h2 className={styles.stepTitle} id={STEP_TITLE_ID} tabIndex={-1}>
                {availability.rooms.length ? "Choose your room" : "Nothing free for these dates"}
              </h2>
              {availability.rooms.length === 0 ? (
                <div className={styles.empty}>
                  <p>
                    Every room is taken from {formatDay(availability.query.checkIn)} to {formatDay(availability.query.checkOut)}. Try other dates, or{" "}
                    <a href={whatsappUrl} target="_blank" rel="noopener">
                      message us on WhatsApp
                    </a>{" "}
                    and we&apos;ll tell you what&apos;s free.
                  </p>
                </div>
              ) : (
                <div className={styles.roomList}>
                  {availability.rooms.map((room, index) => (
                    <RoomCard
                      key={room.roomTypeId}
                      room={room}
                      nights={availability.nights}
                      currency={availability.currency}
                      chosen={cart.filter((item) => item.roomTypeId === room.roomTypeId).length}
                      onAdd={(rate) => addRoom(room, rate)}
                      priority={index === 0}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {availability && step === "extras" && (
            <>
              <button type="button" className={styles.backLink} onClick={() => goTo("rooms")}>
                Back to rooms
              </button>
              <h2 className={styles.stepTitle} id={STEP_TITLE_ID} tabIndex={-1}>
                Extras for your stay
              </h2>
              <p className={styles.stepLead}>Optional. You can also arrange these with us later.</p>
              <Extras
                addOns={availability.addOns}
                currency={availability.currency}
                chosen={extras}
                onChange={(id, quantity) => setExtras({ ...extras, [id]: quantity })}
              />
            </>
          )}

          {availability && step === "details" && (
            <form
              className={styles.detailsForm}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void reserve();
              }}
            >
              <button type="button" className={styles.backLink} onClick={() => goTo(availability.addOns.length ? "extras" : "rooms")}>
                Back
              </button>
              <h2 className={styles.stepTitle} id={STEP_TITLE_ID} tabIndex={-1}>
                Your details
              </h2>
              <p className={styles.stepLead}>The booking is made in this name. We send the confirmation to your email.</p>
              <GuestForm
                guest={guest}
                errors={guestErrors}
                onChange={(next) => {
                  setGuest(next);
                  // A field's message goes once the guest edits that field.
                  const edited = (Object.keys(next) as (keyof Guest)[]).filter((key) => next[key] !== guest[key]);
                  if (edited.some((key) => guestErrors[key])) {
                    setGuestErrors(Object.fromEntries(Object.entries(guestErrors).filter(([key]) => !edited.includes(key as keyof Guest))));
                  }
                }}
                honeypot={honeypot}
                onHoneypot={setHoneypot}
              />
              {submitError && (
                <div className={styles.alert} role="alert">
                  <p>{submitError}</p>
                </div>
              )}
              <button type="submit" className={`${styles.primaryButton} ${styles.submitWide}`} disabled={!quote || submitting} aria-busy={submitting}>
                {submitting ? "Booking" : quote ? `Confirm booking, ${formatMoney(quote.total, availability.currency)}` : "Confirm booking"}
              </button>
            </form>
          )}

          {step === "done" && result && <Confirmation result={result} availability={availability} whatsappUrl={whatsappUrl} />}
        </div>

        {availability && step !== "done" && (
          <aside className={styles.aside}>
            <StaySummary
              availability={availability}
              cart={cart}
              quote={quote}
              editable={step !== "details"}
              onRemove={(index) => setCart(cart.filter((_, position) => position !== index))}
              onGuests={(index, adults, children) =>
                setCart(cart.map((item, position) => (position === index ? { ...item, adults, children } : item)))
              }
              action={continueAction}
            />
          </aside>
        )}
      </div>

      {/* Phones: total and the next step stay at the bottom of the screen. */}
      {availability && quote && continueAction && (
        <div className={styles.mobileBar}>
          <span className={styles.mobileTotal}>
            <span className={styles.fieldLabel}>
              {cart.length} {cart.length === 1 ? "room" : "rooms"}, {availability.nights} {availability.nights === 1 ? "night" : "nights"}
            </span>
            <strong>{formatMoney(quote.total, availability.currency)}</strong>
          </span>
          <button type="button" className={styles.primaryButton} onClick={continueAction.onClick} disabled={continueAction.disabled}>
            {continueAction.label}
          </button>
        </div>
      )}
    </div>
  );
}

function Confirmation({
  result,
  availability,
  whatsappUrl,
}: {
  result: Extract<ReservationResult, { ok: true }>;
  availability: Availability | null;
  whatsappUrl: string;
}) {
  const currency = availability?.currency ?? "IDR";
  return (
    <div className={styles.confirmation}>
      <span className={styles.confirmIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h2 className={styles.stepTitle} id={STEP_TITLE_ID} tabIndex={-1}>
        {result.source === "demo" ? "Demo booking complete" : "Thank you, your booking is in"}
      </h2>
      {result.source === "demo" ? (
        <p>Demo mode: nothing was reserved and no email was sent. With the Cloudbeds API key in place, this step creates the reservation in Cloudbeds.</p>
      ) : (
        <p>
          We sent the details to <strong>{result.guestEmail}</strong>. Keep your booking number for any question about your stay.
        </p>
      )}
      <dl className={styles.confirmFacts}>
        <div>
          <dt>Booking number</dt>
          <dd>{result.reservationId}</dd>
        </div>
        {availability && (
          <div>
            <dt>Stay</dt>
            <dd>
              {formatDay(availability.query.checkIn, { year: undefined })} to {formatDay(availability.query.checkOut)}
            </dd>
          </div>
        )}
        <div>
          <dt>Total</dt>
          <dd>{formatMoney(result.quote.total, currency)}</dd>
        </div>
        <div>
          <dt>Deposit to confirm</dt>
          <dd>{formatMoney(result.quote.deposit, currency)}</dd>
        </div>
      </dl>
      <p>
        Questions or a pickup to arrange?{" "}
        <a href={whatsappUrl} target="_blank" rel="noopener">
          Message us on WhatsApp
        </a>
        .
      </p>
    </div>
  );
}
