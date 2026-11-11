/**
 * Fonts for homepage option C ("Reel"). Google Fonts, SIL Open Font License,
 * downloaded at build time by next/font.
 */
import { Big_Shoulders, Familjen_Grotesk, Reenie_Beanie } from "next/font/google";

/** Tall condensed caps: headlines and the edge codes printed along the film. */
export const reelDisplay = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-reel-display",
  display: "swap",
});

/** Reading text. */
export const reelText = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-reel-text",
  display: "swap",
});

/** Grease-pencil numerals written on the leader. Numerals only. */
export const reelPencil = Reenie_Beanie({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-reel-pencil",
  display: "swap",
});
