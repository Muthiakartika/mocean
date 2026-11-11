import Image from "next/image";
import Link from "next/link";
import { EnvelopeIcon, WhatsappIcon } from "@/components/shared/icons";
import { contact } from "@/data/contact";
import { bookingCta, faq, resortIntro, roomRates, testimonials } from "@/data/homepage";
import Reel from "./Reel";
import { heroFrames } from "./frames";
import { reelDisplay, reelPencil, reelText } from "./fonts";
import styles from "./ReelHome.module.css";
import "./reel-global.css";

const nav = [
  { label: "Rooms", href: "/accommodation/" },
  { label: "Diving", href: "/fun-diving/" },
  { label: "Surf", href: "/surf-lesson/" },
  { label: "Restaurant", href: "/restaurant/" },
  { label: "Pricing", href: "/pricing/" },
  { label: "Contact", href: "/contact/" },
];

/** Address shown with the booking FAQ answer on the current homepage. */
const BOOKING_EMAIL = "bookings@moceanbeachresort.com";

const where = faq.items[0];
const bestTime = faq.items[3];

/** "High Season Price: 2,800,000 IDR" → "2,800,000" */
const amount = (price: string) => price.split(":")[1].replace("IDR", "").trim();
/** "50 square meters with lanai" → "50 m² with lanai" */
const area = (size: string) => size.replace(" square meters", " m²");
const seasons = ["High season", "Shoulder season", "Low season"];

function Tab({ href, children, ghost = false, external = false }: { href: string; children: React.ReactNode; ghost?: boolean; external?: boolean }) {
  return (
    <a
      className={ghost ? styles.tabGhost : styles.tab}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

/**
 * Homepage option C, "Reel": the resort as a reel of colour 16mm film. The
 * photographs are the frames, the facts are printed along the film edge, and
 * the frame in the gate flares orange.
 */
export default function ReelHome() {
  return (
    <div data-home-option="c" className={`${styles.root} ${reelDisplay.variable} ${reelText.variable} ${reelPencil.variable}`}>
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.bar}>
        <Link href="/" className={styles.logo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/uploads/2025/02/Mocean-FULL-Logo_White.png" alt="Mocean Beach Resort" width={1024} height={578} />
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <a className={styles.barCta} href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <WhatsappIcon className={styles.icon} />
          <span>WhatsApp</span>
        </a>
        <details className={styles.menu}>
          <summary>Menu</summary>
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </details>
      </header>

      <section className={styles.hero} aria-labelledby="hero-title">
        <p className={styles.rail} aria-hidden="true">
          <span>Pantai Moro</span>
          <span>8°40′S 116°46′E</span>
          <span>West Sumbawa, Indonesia</span>
        </p>

        <div className={styles.heroCopy}>
          <h1 id="hero-title" className={styles.title}>
            {resortIntro.title}
          </h1>
          <p className={styles.lede}>{resortIntro.strongParagraph}</p>
          <div className={styles.actions}>
            <Tab href={contact.whatsappUrl} external>
              <WhatsappIcon className={styles.icon} />
              {resortIntro.button.label}
            </Tab>
            <Tab href="#rates" ghost>
              See Room Prices
            </Tab>
          </div>
        </div>

        <div className={styles.vstrip}>
          <p className={styles.vedge} aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i}>Mocean Beach Resort · Pantai Moro · 8°40′S 116°46′E</span>
            ))}
          </p>
          {heroFrames.map((frame, index) => (
            <div key={frame.image} className={styles.vframe} data-active={index === 1 || undefined}>
              <Image src={frame.image} alt={frame.alt} fill preload={index === 1} sizes="(max-width: 767px) 100vw, 40vw" />
              {index === 1 && <span className={styles.vleak} aria-hidden="true" />}
            </div>
          ))}
          <span className={styles.spill} aria-hidden="true" />
        </div>
      </section>

      <Reel />

      <section id="rates" className={styles.rates} aria-labelledby="rates-title">
        <div className={styles.sectionHead}>
          <h2 id="rates-title" className={styles.h2}>
            {roomRates.title}
          </h2>
          <p className={styles.note}>{roomRates.note}</p>
        </div>

        <table className={styles.table}>
          <caption className={styles.srOnly}>Room rates in IDR per night by season</caption>
          <thead>
            <tr>
              <th scope="col">Room</th>
              <th scope="col">Size</th>
              <th scope="col">Guests</th>
              {seasons.map((season) => (
                <th key={season} scope="col" className={styles.num}>
                  {season}
                  <span className={styles.unit}>IDR per night</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roomRates.rooms.map((room) => (
              <tr key={room.name}>
                <th scope="row">
                  <span className={styles.thumb}>
                    <Image src={room.image} alt="" fill sizes="120px" />
                  </span>
                  <span className={styles.roomName}>{room.name}</span>
                </th>
                <td data-label="Size">{area(room.size)}</td>
                <td data-label="Guests" className={styles.guests}>
                  {parseInt(room.guests, 10)}
                </td>
                {room.prices.map((price, i) => (
                  <td key={price} data-label={seasons[i]} className={`${styles.num} ${styles.price}`}>
                    {amount(price)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.ratesAction}>
          <Tab href={roomRates.button.href} external>
            <WhatsappIcon className={styles.icon} />
            {roomRates.button.label}
          </Tab>
        </div>
      </section>

      <section className={styles.notes} aria-label="Planning your trip">
        <article className={styles.noteBlock}>
          <h2 className={styles.h3}>{where.question}</h2>
          <p className={styles.place}>On Pantai Moro (Moro Beach) in West Sumbawa, Indonesia.</p>
          <dl className={styles.legs}>
            <div className={styles.leg}>
              <dt>Poto Tano ferry port</dt>
              <dd>
                about <span className={styles.pencilNum}>30</span> minutes by car
              </dd>
            </div>
            <div className={styles.leg}>
              <dt>Sumbawa Besar airport (SWQ)</dt>
              <dd>
                around <span className={styles.pencilNum}>2</span> hours <span className={styles.pencilNum}>15</span> minutes
              </dd>
            </div>
          </dl>
          <p className={styles.small}>We arrange pickups from both.</p>
        </article>

        <article className={styles.noteBlock}>
          <h2 className={styles.h3}>{bestTime.question}</h2>
          <p className={styles.body}>{bestTime.answer}</p>
        </article>
      </section>

      <section className={styles.reviews} aria-labelledby="reviews-title">
        <h2 id="reviews-title" className={styles.h2}>
          {testimonials.title}
        </h2>
        <div className={styles.quotes}>
          {testimonials.items.map((item) => (
            <figure key={item.author} className={styles.quote}>
              <blockquote>
                <p>{item.text.split("\n").join(" ")}</p>
              </blockquote>
              <figcaption>
                {item.author.trim()} <span>{item.source}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className={styles.close}>
        <div className={styles.closeMain}>
          <h2 className={styles.closeTitle}>{bookingCta.title}</h2>
          <p className={styles.closeText}>
            Tell us when you want to come and whether you’re here to dive, surf or slow down. We’ll reply with free rooms, the best rate for your dates and how to
            get here from Bali or Lombok.
          </p>
          <div className={styles.actions}>
            <Tab href={contact.whatsappUrl} external>
              <WhatsappIcon className={styles.icon} />
              {bookingCta.buttons[0].label}
            </Tab>
            <Tab href={bookingCta.buttons[1].href} ghost>
              {bookingCta.buttons[1].label}
            </Tab>
          </div>
        </div>

        <dl className={styles.contact}>
          <div>
            <dt>WhatsApp</dt>
            <dd>
              <a href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
                {contact.phoneDisplay}
              </a>
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${BOOKING_EMAIL}`}>
                <EnvelopeIcon className={styles.iconSmall} />
                {BOOKING_EMAIL}
              </a>
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{contact.address}</dd>
          </div>
          <div>
            <dt>Follow</dt>
            <dd className={styles.follow}>
              <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </dd>
          </div>
        </dl>

        <div className={styles.leader} aria-hidden="true">
          <span>Mocean Beach Resort · Pantai Moro · West Sumbawa</span>
        </div>

        <div className={styles.legal}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.footLogo} src="/images/uploads/2025/02/Mocean-FULL-Logo_White.png" alt="Mocean Beach Resort" width={1024} height={578} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.padi} src="/images/uploads/2025/02/PADI_Logo_SASO_EN_27-new-1024x151.png" alt="PADI" width={1024} height={151} />
          <p className={styles.copyright}>© Copyright PT Mocean Dive Resort | All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}
