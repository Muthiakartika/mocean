import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { EnvelopeIcon, FacebookIcon, InstagramIcon, WhatsappIcon } from "@/components/shared/icons";
import { contact } from "@/data/contact";
import { accommodation, activities, bookingCta, diving, faq, resortIntro, restaurant, roomRates, testimonials } from "@/data/homepage";
import { hand, print, text } from "./fonts";
import styles from "./DayBoard.module.css";

/*
 * Homepage option A, "The day board": the resort's enamel whiteboard on a cobalt wall.
 * Every fact and sentence comes from src/data/homepage.ts (cut down, never new).
 */

const up = (path: string) => `/images/uploads/${path}`;

type Photo = { src: string; width: number; height: number; alt: string };

const photos = {
  aerial: { src: up("2025/06/Slider-mocean-1.jpg"), width: 1920, height: 1050, alt: "Aerial view of Pantai Moro: the resort on the beach below a hill, turquoise water in front" },
  bungalows: { src: up("2025/09/accommodation_galery_12.jpg"), width: 1650, height: 1100, alt: "Thatched bungalows along a garden path with bougainvillea" },
  bungalowRoom: { src: up("2025/09/accommodation_galery_5.jpg"), width: 1650, height: 1100, alt: "Bungalow bedroom with a king bed under a high thatched ceiling" },
  standardRoom: { src: up("2025/10/Standard-room-King-Bed.jpg"), width: 1650, height: 1100, alt: "Standard Room with a king bed and blue covers" },
  gearRoom: { src: up("2025/05/dive_1.jpg"), width: 1700, height: 1486, alt: "Gear room with individual lockers for dive equipment" },
  manta: { src: up("2025/06/The_diving_5.jpg"), width: 1700, height: 1486, alt: "Manta ray gliding over a reef" },
  surf: { src: up("2025/06/74.jpg"), width: 1650, height: 1100, alt: "Surfer riding a wave with green hills behind" },
  restaurant: { src: up("2025/05/Dine_1.jpg"), width: 1700, height: 1486, alt: "Open-air restaurant under a thatched roof, looking out to the beach" },
  food: { src: up("2025/05/Dine_5.jpg"), width: 1700, height: 1486, alt: "Satay and fritters with sambal on blue placemats" },
  kalela: { src: up("2025/10/Kalela-Waterfall-Rice-Field-Coconut-Plantation.jpg"), width: 1700, height: 1486, alt: "Swing hanging from a tree over the water by a jetty" },
} satisfies Record<string, Photo>;

const nav = [
  { label: "Rooms", href: "/accommodation/" },
  { label: "Diving", href: "/fun-diving/" },
  { label: "Surf", href: "/surf-lesson/" },
  { label: "Restaurant", href: "/restaurant/" },
  { label: "Pricing", href: "/pricing/" },
  { label: "Contact", href: "/contact/" },
];

/** The four columns ruled on the board, each pointing to its own board further down. */
const day = [
  { label: "Dive", line: "Our house reef and two-tank boat dives", note: "from IDR 2,200,000", href: "#dive" },
  { label: "Surf", line: "Northern Rights, right in front of the resort", href: "#surf" },
  { label: "Slow down", line: "A palm-lined pool on the beach", href: "#rooms" },
  { label: "Eat", line: "Mutiara by Mocean, open from breakfast to dinner", href: "#eat" },
];

const diveKit = ["Custom-built boat", "Individual gear lockers", "Camera room", "Equipment rental", "PADI instruction", "Purpose-built training pool"];

const tours = [
  { label: "Agal Waterfall", href: "/sumbawa-indonesia-tour/agal-waterfall/" },
  { label: "Rice Field Walk", href: "/sumbawa-indonesia-tour/rice-field-walk/" },
  { label: "Danau Lebo Taliwang", href: "/sumbawa-indonesia-tour/danau-lebo/" },
  { label: "Kalela Waterfall", href: "/kalela-waterfall/" },
];

/** "High Season Price: 2,800,000 IDR" → ["High", "2,800,000"] */
function splitPrice(line: string) {
  const [label, value] = line.split(":");
  return [label.replace(" Season Price", "").trim(), value.replace("IDR", "").trim()] as const;
}

/** King and twin versions share a price, so the sheet shows one row per room type. */
const roomTypes = roomRates.rooms.reduce<
  { name: string; beds: string[]; size: string; guests: string; prices: (readonly [string, string])[] }[]
>((rows, room) => {
  const [name, beds] = room.name.split(" with ");
  const bed = beds.replace(/ Beds?$/, "");
  const row = rows.find((r) => r.name === name);
  if (row) row.beds.push(bed);
  else rows.push({ name, beds: [bed], size: room.size.replace("square meters", "m²"), guests: room.guests.replace(/ Guests?$/, ""), prices: room.prices.map(splitPrice) });
  return rows;
}, []);

const seasons = roomTypes[0].prices.map(([label]) => label);
const bookingEmail = "bookings@moceanbeachresort.com"; // as in the homepage FAQ

export default function DayBoard() {
  return (
    <div className={`${styles.root} ${hand.variable} ${print.variable} ${text.variable}`} data-home-option="a">
      <header className={styles.rail}>
        <Link href="/" className={styles.logoLink}>
          <Image src={up("2025/02/Mocean-FULL-Logo_White.png")} alt="Mocean Beach Resort" width={2383} height={1345} className={styles.logo} priority sizes="96px" />
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
        <a className={styles.railCta} href={contact.whatsappUrl} target="_blank" rel="noopener">
          <WhatsappIcon className={styles.icon} />
          WhatsApp
        </a>
      </header>

      {/* Board 1: the day */}
      <section className={styles.wallSection} aria-labelledby="a-title">
        <Board tray>
          <div className={styles.hero}>
            <figure className={`${styles.heroPrint} ${styles.figure}`}>
              <Print photo={photos.aerial} ratio="16 / 10" tilt={-1.2} priority sizes="(max-width: 900px) 92vw, 54vw" />
              <figcaption className={styles.caption}>a quiet 2-kilometre stretch of Pantai Moro</figcaption>
            </figure>

            <div className={styles.heroText}>
              <h1 id="a-title" className={styles.h1}>
                West Sumbawa’s only beachfront dive and surf resort
              </h1>
              <p className={styles.handLine}>{resortIntro.strongParagraph.split(". ")[0]}.</p>
              <div className={styles.ctaRow}>
                <span className={styles.circled}>
                  <a className={styles.btn} href={contact.whatsappUrl} target="_blank" rel="noopener">
                    <WhatsappIcon className={styles.icon} />
                    {resortIntro.button.label}
                  </a>
                  <MarkerCircle className={styles.circle} />
                </span>
                <a className={styles.handLink} href="#rooms">
                  See Room Prices
                  <MarkerArrow className={styles.arrowDown} />
                </a>
              </div>
            </div>

            <ul className={styles.day}>
              {day.map((col) => (
                <li key={col.label} className={styles.dayCol}>
                  <a href={col.href} className={styles.dayLink}>
                    <span className={styles.label}>{col.label}</span>
                    <span className={styles.dayLine}>{col.line}</span>
                    {col.note && <span className={styles.dayNote}>{col.note}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Board>
      </section>

      {/* Board 2: rooms and the printed price sheet */}
      <section id="rooms" className={styles.wallSection} aria-labelledby="a-rooms">
        <Board>
          <div className={styles.rooms}>
            <div className={styles.roomsHead}>
              <h2 id="a-rooms" className={styles.h2}>
                {accommodation.title}
              </h2>
              <MarkerLine className={styles.underline} />
              <ol className={styles.tiles} aria-label="The ten rooms">
                {Array.from({ length: 10 }, (_, i) => (
                  <li key={i} className={i < 6 ? styles.tileBungalow : styles.tileStandard}>
                    {i < 6 ? "Bungalow" : "Standard"}
                  </li>
                ))}
              </ol>
              <p className={styles.handNote}>Six handcrafted bungalows, four garden-view Standard Rooms</p>
            </div>

            <div className={styles.sheetWrap}>
              <div className={styles.sheet}>
                <Magnet className={styles.magnetLeft} />
                <Magnet className={styles.magnetRight} />
                <h3 className={styles.sheetTitle}>{roomRates.title}</h3>
                <table className={styles.rates}>
                  <caption className={styles.srOnly}>Room rates per night in IDR, by season</caption>
                  <thead>
                    <tr>
                      <th scope="col">Room</th>
                      {seasons.map((s) => (
                        <th key={s} scope="col" className={styles.num}>
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roomTypes.map((room) => (
                      <tr key={room.name}>
                        <th scope="row">
                          <span className={styles.roomName}>{room.name}</span>
                          <span className={styles.roomMeta}>
                            {room.beds.join(" or ").replace(" or T", " or t")} beds · {room.size} · {room.guests} guests
                          </span>
                        </th>
                        {room.prices.map(([season, value]) => (
                          <td key={season} className={styles.num} data-label={season}>
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={styles.sheetUnit}>IDR per night</p>
              </div>
              <p className={styles.sheetNote}>
                <MarkerArrow className={styles.arrowUp} />
                {roomRates.note}
              </p>
            </div>

            <div className={styles.printRow}>
              {[
                { photo: photos.bungalows, caption: "Deluxe Bungalows", tilt: -1 },
                { photo: photos.bungalowRoom, caption: "Deluxe Bungalow with King Bed", tilt: 0.8 },
                { photo: photos.standardRoom, caption: "Standard Room with King Bed", tilt: -0.6 },
              ].map((p) => (
                <figure key={p.caption} className={styles.figure}>
                  <Print photo={p.photo} ratio="3 / 2" tilt={p.tilt} sizes="(max-width: 900px) 80vw, 28vw" />
                  <figcaption className={styles.caption}>{p.caption}</figcaption>
                </figure>
              ))}
            </div>

            <a className={styles.handLink} href={accommodation.button.href}>
              {accommodation.button.label}
              <MarkerArrow className={styles.arrowRight} />
            </a>
          </div>
        </Board>
      </section>

      {/* Boards 3 and 4: dive and surf, side by side */}
      <div className={styles.pair}>
        <section id="dive" className={styles.wallSection} aria-labelledby="a-dive">
          <Board>
            <div className={styles.dive}>
              <h2 id="a-dive" className={styles.h2}>
                {diving.title}
              </h2>
              <MarkerLine className={styles.underline} />
              <ul className={styles.ticks}>
                {diveKit.map((item) => (
                  <li key={item}>
                    <MarkerTick className={styles.tick} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className={styles.bigHand}>
                Two-tank boat dives from <span className={styles.nowrap}>IDR 2,200,000</span>, no more than four divers per guide.
              </p>
              <div className={styles.printPair}>
                <figure className={styles.figure}>
                  <Print photo={photos.gearRoom} ratio="4 / 3" tilt={-1.4} sizes="(max-width: 900px) 44vw, 20vw" />
                  <figcaption className={styles.caption}>the gear room</figcaption>
                </figure>
                <figure className={styles.figure}>
                  <Print photo={photos.manta} ratio="4 / 3" tilt={1.1} sizes="(max-width: 900px) 44vw, 20vw" />
                  <figcaption className={styles.caption}>dive season 1 April to 31 October</figcaption>
                </figure>
              </div>
              <a className={styles.handLink} href={diving.button.href}>
                {diving.button.label}
                <MarkerArrow className={styles.arrowRight} />
              </a>
            </div>
          </Board>
        </section>

        <section id="surf" className={styles.wallSection} aria-labelledby="a-surf">
          <Board>
            <div className={styles.surf}>
              <h2 id="a-surf" className={styles.h2}>
                Northern Rights, right in front of the resort
              </h2>
              <MarkerLine className={styles.underline} />
              <SurfSketch className={styles.sketch} />
              <p className={styles.handNote}>Middle Reef and Dirty Hippies are a short walk down the beach.</p>
              <figure className={styles.figure}>
                <Print photo={photos.surf} ratio="16 / 9" tilt={0.7} sizes="(max-width: 900px) 88vw, 40vw" />
                <figcaption className={styles.caption}>May to October: the most consistent surf</figcaption>
              </figure>
              <div className={styles.linkRow}>
                <a className={styles.handLink} href="/surf-lesson/">
                  Surf Lesson
                  <MarkerArrow className={styles.arrowRight} />
                </a>
                <a className={styles.handLink} href="/surf-trip/">
                  Surf Trip
                  <MarkerArrow className={styles.arrowRight} />
                </a>
              </div>
            </div>
          </Board>
        </section>
      </div>

      {/* Board 5: the restaurant, the tours and two reviews taped to the board */}
      <section id="eat" className={styles.wallSection} aria-labelledby="a-eat">
        <Board>
          <div className={styles.eat}>
            <div className={styles.eatText}>
              <h2 id="a-eat" className={styles.h2}>
                {restaurant.title}
              </h2>
              <MarkerLine className={styles.underline} />
              <p className={styles.handNote}>{restaurant.paragraphs[0].split(". ")[0].replace("Enjoy b", "B")}.</p>
              <a className={styles.handLink} href={restaurant.button.href}>
                {restaurant.button.label}
                <MarkerArrow className={styles.arrowRight} />
              </a>
            </div>
            <div className={styles.eatPrints}>
              <figure className={styles.figure}>
                <Print photo={photos.restaurant} ratio="4 / 3" tilt={-0.9} sizes="(max-width: 900px) 44vw, 22vw" />
              </figure>
              <figure className={styles.figure}>
                <Print photo={photos.food} ratio="4 / 3" tilt={1.3} sizes="(max-width: 900px) 44vw, 22vw" />
              </figure>
            </div>

            <div className={styles.tours}>
              <h3 className={styles.h3}>{activities.title}</h3>
              <ul className={styles.tourList}>
                {tours.map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className={styles.tourLink}>
                      <MarkerArrow className={styles.arrowSmall} />
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <figure className={styles.figure}>
                <Print photo={photos.kalela} ratio="4 / 3" tilt={0.6} sizes="(max-width: 900px) 60vw, 18vw" />
              </figure>
            </div>

            <div className={styles.slips}>
              {testimonials.items.map((t, i) => (
                <blockquote key={t.author} className={styles.slip} style={{ "--tilt": `${i ? 1.2 : -1.6}deg` } as CSSProperties}>
                  <span className={styles.tape} aria-hidden="true" />
                  <p className={styles.slipText}>{t.text.replace(/\n/g, " ")}</p>
                  <footer className={styles.slipBy}>
                    {t.author.trim()}, {t.source}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </Board>
      </section>

      {/* Board 6: how to get here, drawn as two routes */}
      <section id="getting-here" className={styles.wallSection} aria-labelledby="a-route">
        <Board>
          <div className={styles.routeBoard}>
            <h2 id="a-route" className={styles.h2}>
              How to get here
            </h2>
            <MarkerLine className={styles.underline} />
            <ol className={styles.route} aria-label="By ferry">
              <li className={styles.stop}>Lombok</li>
              <li className={styles.leg}>
                <MarkerArrow className={styles.legArrow} />
                ferry
              </li>
              <li className={styles.stop}>Poto Tano</li>
              <li className={styles.leg}>
                <MarkerArrow className={styles.legArrow} />
                about 30 minutes by car
              </li>
              <li className={`${styles.stop} ${styles.stopHome}`}>Mocean</li>
            </ol>
            <ol className={styles.route} aria-label="By air">
              <li className={styles.stop}>Sumbawa Besar airport (SWQ)</li>
              <li className={styles.leg}>
                <MarkerArrow className={styles.legArrow} />
                around 2 hours 15 minutes
              </li>
              <li className={`${styles.stop} ${styles.stopHome}`}>Mocean</li>
            </ol>
            <p className={styles.bigHand}>We arrange pickups from both.</p>
            <ul className={styles.seasonList}>
              {faq.items[3].answer.split(". ").map((s) => (
                <li key={s}>{s.replace(/\.$/, "")}</li>
              ))}
            </ul>
            <a className={styles.handLink} href="/travel-lombok-sumbawa/">
              Transfer
              <MarkerArrow className={styles.arrowRight} />
            </a>
          </div>
        </Board>
      </section>

      {/* Close: the last board, then the wall */}
      <section className={styles.wallSection} aria-labelledby="a-book">
        <Board>
          <div className={styles.close}>
            <h2 id="a-book" className={styles.closeTitle}>
              {bookingCta.title}
            </h2>
            <p className={styles.handLine}>{bookingCta.text.split(". ")[0]}.</p>
            <div className={styles.ctaRow}>
              <span className={styles.circled}>
                <a className={styles.btn} href={contact.whatsappUrl} target="_blank" rel="noopener">
                  <WhatsappIcon className={styles.icon} />
                  {bookingCta.buttons[0].label}
                </a>
                <MarkerCircle className={styles.circle} />
              </span>
              <a className={styles.btnQuiet} href={contact.cloudbedsUrl} target="_blank" rel="noopener">
                Book online
              </a>
            </div>
            <p className={styles.contactLine}>
              <a href={`mailto:${bookingEmail}`} className={styles.textLink}>
                <EnvelopeIcon className={styles.iconSmall} />
                {bookingEmail}
              </a>
              <a href={contact.whatsappUrl} className={styles.textLink} target="_blank" rel="noopener">
                <WhatsappIcon className={styles.iconSmall} />
                {contact.phoneDisplay}
              </a>
            </p>
          </div>
        </Board>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <Image src={up("2025/02/Mocean-FULL-Logo_White.png")} alt="Mocean Beach Resort" width={2383} height={1345} className={styles.footerLogo} sizes="120px" />
          <p className={styles.footerAddress}>
            {contact.address}
            <br />
            8°40′S 116°46′E
          </p>
          <span className={styles.padiPlate}>
            <Image src={up("2025/02/PADI_Logo_SASO_EN_27-new-1024x151.png")} alt="PADI" width={1024} height={151} className={styles.padi} sizes="200px" />
          </span>
        </div>
        <div className={styles.footerBottom}>
          <nav aria-label="Guides" className={styles.footerNav}>
            <Link href="/dive-sites/">Dive Sites</Link>
            <Link href="/surf-spots/">Surf Spots</Link>
            <Link href="/sumbawa-indonesia/">Tour & Activity</Link>
            <Link href="/news/">News</Link>
          </nav>
          <div className={styles.social}>
            <a href={contact.facebookUrl} aria-label="Facebook" target="_blank" rel="noopener">
              <FacebookIcon className={styles.iconSmall} />
            </a>
            <a href={contact.instagramUrl} aria-label="Instagram" target="_blank" rel="noopener">
              <InstagramIcon className={styles.iconSmall} />
            </a>
          </div>
          <p className={styles.copyright}>© Copyright PT Mocean Dive Resort | All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}

/** An enamel whiteboard in an aluminium frame, optionally with the marker tray. */
function Board({ children, tray = false }: { children: ReactNode; tray?: boolean }) {
  return (
    <div className={styles.boardWrap}>
      <div className={styles.frame}>
        <div className={styles.surface}>{children}</div>
      </div>
      {tray && (
        <div className={styles.tray} aria-hidden="true">
          <span className={styles.trayLabel}>Pantai Moro · West Sumbawa · 8°40′S 116°46′E</span>
          <Markers className={styles.markers} />
        </div>
      )}
    </div>
  );
}

/** A white-bordered photo print held by two magnets. */
function Print({ photo, ratio, tilt, sizes, priority = false }: { photo: Photo; ratio: string; tilt: number; sizes: string; priority?: boolean }) {
  return (
    <div className={styles.print} style={{ "--tilt": `${tilt}deg`, "--ratio": ratio } as CSSProperties}>
      <Magnet className={styles.magnetLeft} />
      <Magnet className={styles.magnetRight} />
      <Image className={styles.printImg} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={sizes} priority={priority} />
    </div>
  );
}

function Magnet({ className }: { className: string }) {
  return <span className={`${styles.magnet} ${className}`} aria-hidden="true" />;
}

/* Marker strokes. Every one is drawn with the same stroke width (--stroke). */

function MarkerCircle({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">
      <path
        pathLength={1}
        vectorEffect="non-scaling-stroke"
        d="M34 62 C 14 36 86 10 166 9 C 248 8 314 26 311 52 C 308 80 230 93 154 92 C 76 91 9 78 12 52 C 14 34 46 21 92 14"
      />
    </svg>
  );
}

function MarkerLine({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M2 8 C 48 3 118 10 198 4" />
    </svg>
  );
}

function MarkerArrow({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 64 24" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M3 13 C 20 10 38 14 58 11 M47 3 L 60 11 L 48 20" />
    </svg>
  );
}

function MarkerTick({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 26 22" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" d="M2 12 C 5 14 7 17 9 19 C 14 12 18 7 24 2" />
    </svg>
  );
}

/** The beach, the resort and the break in front of it, drawn on the board. */
function SurfSketch({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 520 230" role="img" aria-label="Sketch: Northern Rights breaks in the water right in front of the resort on Pantai Moro">
      <g className={styles.sketchInk}>
        <path vectorEffect="non-scaling-stroke" d="M6 168 C 120 156 250 176 380 160 C 430 154 480 158 514 152" />
        <path vectorEffect="non-scaling-stroke" d="M214 204 L 234 186 L 254 204 M222 204 L 222 214 L 246 214 L 246 204" />
        <path vectorEffect="non-scaling-stroke" d="M264 206 L 282 190 L 300 206 M271 206 L 271 216 L 293 216 L 293 206" />
        <path vectorEffect="non-scaling-stroke" d="M120 86 C 150 58 196 52 226 70 C 244 81 250 98 236 104 C 224 109 214 98 222 90" />
        <path vectorEffect="non-scaling-stroke" d="M226 70 C 268 62 320 66 372 84" />
        <path vectorEffect="non-scaling-stroke" d="M104 110 C 160 102 230 112 300 104 C 340 100 380 108 410 104" />
        <path className={styles.sketchDash} vectorEffect="non-scaling-stroke" d="M256 182 C 252 160 246 138 238 116" />
      </g>
      <text x="300" y="56" className={styles.sketchLabel}>
        Northern Rights
      </text>
      <text x="314" y="208" className={styles.sketchLabel}>
        Mocean
      </text>
      <text x="16" y="196" className={styles.sketchLabelSmall}>
        Pantai Moro
      </text>
    </svg>
  );
}

/** Three markers and an eraser lying on the tray. */
function Markers({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 330 28">
      <g>
        <rect x="0" y="9" width="92" height="14" rx="4" fill="#e9ecee" stroke="#9aa3a8" />
        <rect x="88" y="10" width="20" height="12" rx="3" fill="#1b3ea6" />
        <rect x="118" y="9" width="92" height="14" rx="4" fill="#e9ecee" stroke="#9aa3a8" />
        <rect x="206" y="10" width="20" height="12" rx="3" fill="#1b1d20" />
        <rect x="236" y="9" width="70" height="14" rx="4" fill="#e9ecee" stroke="#9aa3a8" />
        <rect x="302" y="10" width="20" height="12" rx="3" fill="#d1352b" />
      </g>
    </svg>
  );
}
