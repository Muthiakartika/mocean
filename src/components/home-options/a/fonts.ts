/**
 * Option A ("The day board") fonts. Google Fonts, SIL Open Font License,
 * self-hosted by next/font like the site fonts in src/app/fonts.ts.
 */
import { Kalam, Sofia_Sans, Sofia_Sans_Extra_Condensed } from "next/font/google";

/** Felt-pen hand: everything written on the board. */
export const hand = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-a-hand",
  display: "swap",
});

/** Printed labels: board tabs, magnets, buttons. */
export const print = Sofia_Sans_Extra_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-a-print",
  display: "swap",
});

/** Reading text: the price sheet, reviews, footer. */
export const text = Sofia_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-a-text",
  display: "swap",
});
