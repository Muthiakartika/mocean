import type { Metadata } from "next";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingButtons from "@/components/layout/FloatingButtons";
import { SITE_URL } from "@/data/contact";
import { isProduction } from "@/lib/metadata";
import { jost, quicksand, roboto, rtIcons } from "./fonts";
import "./globals.css";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/images/uploads/2025/05/mocean-favicon-87x87.jpg", sizes: "32x32" },
      { url: "/images/uploads/2025/05/mocean-favicon-300x300.jpg", sizes: "192x192" },
    ],
    apple: "/images/uploads/2025/05/mocean-favicon-300x300.jpg",
  },
  // Preview / local builds are never indexed.
  ...(isProduction ? {} : { robots: { index: false, follow: false } }),
};

const ORIGINAL_DESIGN_SWITCH = `if (/[?&]original(=|&|$)/.test(location.search)) document.documentElement.dataset.design = "original";
var h = location.search.match(/[?&]header=(bar)/); if (h) document.documentElement.dataset.header = h[1];`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fontVariables = `${quicksand.variable} ${jost.variable} ${roboto.variable} ${rtIcons.variable}`;

  return (
    // suppressHydrationWarning: the inline script below may set data-design before React hydrates.
    <html lang="en-US" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* "?original" in the URL shows the original design (switches off the redesign layer, see MASTER.md). */}
        <script dangerouslySetInnerHTML={{ __html: ORIGINAL_DESIGN_SWITCH }} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingButtons />

        {/* Ahrefs Web Analytics — the only tracking script on the original site. */}
        {isProduction && (
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            data-key="BIyHVfWYrucIZ49dWHIDlw"
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
