import { Archivo, Source_Serif_4 } from "next/font/google";

/** Land names, labels, body text and controls (upright, width axis for tracked caps). */
export const chartSans = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-chart-sans",
  display: "swap",
});

/** Water names, titles and notes (sloping italic for features at sea, as on a chart). */
export const chartSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-chart-serif",
  display: "swap",
});
