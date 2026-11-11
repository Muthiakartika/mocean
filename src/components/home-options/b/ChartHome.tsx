import Image from "next/image";
import Link from "next/link";
import { contact } from "@/data/contact";
import { diving, faq, restaurant, roomRates, testimonials } from "@/data/homepage";
import Chart from "./Chart";
import { chartSans, chartSerif } from "./fonts";
import styles from "./ChartHome.module.css";

const img = (path: string) => `/images/uploads/${path}`;
const LOGO = img("2025/02/Mocean-FULL-Logo_White.png");
const PADI = img("2025/02/PADI_Logo_SASO_EN_27-new-1024x151.png");
const EMAIL = "bookings@moceanbeachresort.com";

const links = [
  { label: "Rooms", href: "/accommodation/" },
  { label: "Diving", href: "/fun-diving/" },
  { label: "Surf", href: "/surf-lesson/" },
  { label: "Restaurant", href: "/restaurant/" },
  { label: "Pricing", href: "/pricing/" },
  { label: "Contact", href: "/contact/" },
];

/** "High Season Price: 2,800,000 IDR" -> "2,800,000" */
const amount = (price: string) => price.split(":")[1].replace("IDR", "").trim();
const roomSize = (size: string) => size.replace(" square meters", " m²");

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** From the FAQ answer "When is the best time to visit West Sumbawa?" (months are 1-based, inclusive). */
const seasons = [
  { name: "Dry season", detail: "Most consistent surf, clearest water", spans: [[5, 10]], tone: "dry" },
  { name: "Dive season", detail: "1 April to 31 October", spans: [[4, 10]], tone: "dive" },
  { name: "Greener and quieter", detail: "Lower room rates", spans: [[11, 12], [1, 4]], tone: "green" },
] as const;

const reviews = testimonials.items.map((item) => ({
  text: item.text.split("\n").join(" "),
  author: item.author.trim(),
  source: item.source,
}));

function NoteTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className={styles.noteTitle}>
      <span className={styles.noteNo} aria-hidden="true">
        {n}
      </span>
      {children}
    </h3>
  );
}

function Plate({ src, width, height, caption, sizes }: { src: string; width: number; height: number; caption: string; sizes: string }) {
  return (
    <figure className={styles.plate}>
      <Image src={src} alt={caption} width={width} height={height} sizes={sizes} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** Homepage option B: a nautical chart of the Alas Strait with Mocean plotted on it. */
export default function ChartHome() {
  return (
    <div data-home-option="b" className={`${chartSans.variable} ${chartSerif.variable} ${styles.root}`}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <Image className={styles.logo} src={LOGO} alt="Mocean Beach Resort" width={2383} height={1345} sizes="80px" priority />
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <details className={styles.menu}>
          <summary>Menu</summary>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </details>
        <a className={styles.headerCta} href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </header>

      <section className={styles.hero} aria-labelledby="b-title">
        <div className={styles.sheet}>
          <Chart className={styles.chart} />

          <div className={styles.cartouche}>
            <h1 id="b-title" className={styles.title}>
              Mocean Beach Resort
            </h1>
            <p className={styles.place}>Pantai Moro, West Sumbawa, Indonesia</p>
            <p className={styles.offer}>
              West Sumbawa’s only beachfront dive and surf resort. Six bungalows and four Standard Rooms, so it never
              feels busy.
            </p>
            <div className={styles.actions}>
              <a className={styles.primary} href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
                Check Dates on WhatsApp
              </a>
              <Link className={styles.textLink} href="/pricing/">
                See Room Prices
              </Link>
            </div>
            <p className={styles.position}>8°40′S 116°46′E</p>
          </div>

          <figure className={styles.inset}>
            <Image
              src={img("2025/06/Slider-mocean-1.jpg")}
              alt="Pantai Moro and the resort from the air"
              width={1920}
              height={1050}
              sizes="(max-width: 1099px) 30vw, 360px"
              priority
            />
            <figcaption>Pantai Moro from the air</figcaption>
          </figure>
        </div>
      </section>

      <section className={styles.notes} aria-labelledby="b-notes-title">
        <div className={styles.notesHead}>
          <h2 id="b-notes-title" className={styles.sectionTitle}>
            Notes
          </h2>
          <p className={styles.notesKey}>The numbers match the marks on the chart.</p>
        </div>

        <article id="note-1" className={`${styles.note} ${styles.noteStay}`}>
          <Plate
            src={img("2025/09/accommodation_galery_12.jpg")}
            width={1650}
            height={1100}
            caption="Bungalows and garden"
            sizes="(max-width: 767px) 100vw, 40vw"
          />
          <div className={styles.stayBody}>
            <NoteTitle n={1}>Bungalows and Rooms by the Beach</NoteTitle>
            <p className={styles.text}>
              Six handcrafted bungalows and four Standard Rooms, a palm-lined pool on the beach, and a restaurant
              that’s open from breakfast to dinner.
            </p>
            <table className={styles.rates}>
              <caption>Room rates per night, IDR</caption>
              <thead>
                <tr>
                  <th scope="col">Room</th>
                  <th scope="col">Size</th>
                  <th scope="col">Guests</th>
                  <th scope="col" className={styles.num}>High</th>
                  <th scope="col" className={styles.num}>Shoulder</th>
                  <th scope="col" className={styles.num}>Low</th>
                </tr>
              </thead>
              <tbody>
                {roomRates.rooms.map((room) => (
                  <tr key={room.name}>
                    <th scope="row">{room.name}</th>
                    <td data-label="Size">{roomSize(room.size)}</td>
                    <td data-label="Guests">{room.guests.replace(" Guest", "")}</td>
                    {room.prices.map((price, i) => (
                      <td key={price} className={styles.num} data-label={["High season", "Shoulder", "Low season"][i]}>
                        {amount(price)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.small}>{roomRates.note}</p>
            <Link className={styles.textLink} href="/accommodation/">
              See the Rooms
            </Link>
          </div>
        </article>

        <div className={styles.threeUp}>
          <article id="note-2" className={styles.note}>
            <Plate src={img("2025/05/Dine_1.jpg")} width={1700} height={1486} caption="Mutiara by Mocean" sizes="(max-width: 767px) 100vw, 30vw" />
            <NoteTitle n={2}>{restaurant.sub}</NoteTitle>
            <p className={styles.text}>
              Bold grilled favorites and fresh dishes inspired by the Asia-Pacific region, in an open-air setting on
              Moro Beach, from breakfast to a sunset dinner.
            </p>
            <Link className={styles.textLink} href={restaurant.button.href}>
              {restaurant.button.label}
            </Link>
          </article>

          <article id="note-3" className={styles.note}>
            <Plate src={img("2025/06/The_diving_5.jpg")} width={1700} height={1486} caption="Manta over the reef" sizes="(max-width: 767px) 100vw, 30vw" />
            <NoteTitle n={3}>{diving.title}</NoteTitle>
            <p className={styles.text}>
              A custom-built boat with room for guests and gear, individual gear lockers, a camera room and a pool for
              dive instruction. Equipment rental and PADI courses.
            </p>
            <p className={styles.figure}>{diving.paragraphs[1]}</p>
            <Link className={styles.textLink} href={diving.button.href}>
              {diving.button.label}
            </Link>
          </article>

          <article id="note-4" className={styles.note}>
            <Plate src={img("2025/06/74.jpg")} width={1650} height={1100} caption="Surf" sizes="(max-width: 767px) 100vw, 30vw" />
            <NoteTitle n={4}>Northern Rights</NoteTitle>
            <p className={styles.text}>
              Northern Rights breaks right in front of the resort, with Middle Reef and Dirty Hippies a short walk down
              the beach.
            </p>
            <Link className={styles.textLink} href="/surf-lesson/">
              Surf Lessons
            </Link>
          </article>
        </div>

        <div className={styles.twoUp}>
          <article id="note-5" className={styles.note}>
            <NoteTitle n={5}>Getting Here</NoteTitle>
            <dl className={styles.routes}>
              <div>
                <dt>Ferry to Poto Tano</dt>
                <dd>about 30 min by car</dd>
              </div>
              <div>
                <dt>Sumbawa Besar airport (SWQ)</dt>
                <dd>about 2 h 15 min by car</dd>
              </div>
            </dl>
            <p className={styles.text}>We arrange pickups from both.</p>
            <Link className={styles.textLink} href="/travel-lombok-sumbawa/">
              Transfers from Bali and Lombok
            </Link>
          </article>

          <article id="note-6" className={styles.note}>
            <NoteTitle n={6}>Seasons</NoteTitle>
            <div className={styles.seasons} role="table" aria-label="Seasons in West Sumbawa by month">
              <div className={styles.seasonRow} role="row">
                <span role="columnheader" className={styles.seasonLabel}>
                  <span className="sr-only-text">Season</span>
                </span>
                {MONTHS.map((m, i) => (
                  <span key={i} role="columnheader" className={styles.month}>
                    <abbr title={MONTH_NAMES[i]}>{m}</abbr>
                  </span>
                ))}
              </div>
              {seasons.map((season) => (
                <div key={season.name} className={styles.seasonRow} role="row">
                  <span role="rowheader" className={styles.seasonLabel}>
                    <strong>{season.name}</strong>
                    <span>{season.detail}</span>
                  </span>
                  {MONTHS.map((_, i) => {
                    const month = i + 1;
                    const on = season.spans.some(([from, to]) => month >= from && month <= to);
                    return (
                      <span
                        key={i}
                        role="cell"
                        className={`${styles.cell} ${on ? styles[season.tone] : ""}`}
                        aria-label={`${MONTH_NAMES[i]}: ${on ? "yes" : "no"}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <p className={`${styles.small} ${styles.seasonNote}`}>{faq.items[3].answer}</p>
          </article>
        </div>
      </section>

      <section className={styles.remarks} aria-labelledby="b-remarks-title">
        <h2 id="b-remarks-title" className={styles.sectionTitle}>
          {testimonials.title}
        </h2>
        <div className={styles.quotes}>
          {reviews.map((review) => (
            <figure key={review.author} className={styles.quote}>
              <blockquote>
                <p>{review.text}</p>
              </blockquote>
              <figcaption>
                {review.author}, <span>{review.source}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.close} aria-labelledby="b-close-title">
        <div className={styles.closeBody}>
          <h2 id="b-close-title" className={styles.sectionTitle}>
            Book Your Stay at Mocean
          </h2>
          <p className={styles.text}>
            Tell us when you want to come and whether you’re here to dive, surf or slow down. We’ll reply with free
            rooms, the best rate for your dates and how to get here from Bali or Lombok.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
              Check Dates on WhatsApp
            </a>
            <Link className={styles.textLink} href="/pricing/">
              See Room Prices
            </Link>
          </div>
        </div>
        <dl className={styles.contactList}>
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
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{contact.address}</dd>
          </div>
          <div>
            <dt>Position</dt>
            <dd className={styles.coords}>8°40′S 116°46′E</dd>
          </div>
        </dl>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLogos}>
          <Image className={styles.logo} src={LOGO} alt="Mocean Beach Resort" width={2383} height={1345} sizes="80px" />
          <Image className={styles.padi} src={PADI} alt="PADI" width={1024} height={151} sizes="160px" />
        </div>
        <nav aria-label="Footer">
          <ul className={styles.footerLinks}>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            <li>
              <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </li>
          </ul>
        </nav>
        <p className={styles.copyright}>© Copyright PT Mocean Dive Resort | All Rights Reserved</p>
      </footer>
    </div>
  );
}
