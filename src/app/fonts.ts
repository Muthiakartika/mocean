/**
 * Fonts used by the original site (all Google Fonts, SIL Open Font License).
 * next/font downloads them at build time and serves them from our own domain.
 */
import { Jost, Quicksand, Roboto } from "next/font/google";
import localFont from "next/font/local";

/** Body text, headings, buttons. */
export const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

/** Desktop menu links and the footer copyright line. */
export const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

/** Only used by one text layer in the home hero slider. */
export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-roboto",
  display: "swap",
});

/** Icon font from the Moonlit theme (phone, location, user icons). */
export const rtIcons = localFont({
  src: "../../public/fonts/rt-icons.woff2",
  variable: "--font-rt-icons",
  display: "block",
});
