import type { Metadata } from "next";

/** Homepage design options are previews: never indexed, not in the sitemap. */
export function optionMetadata(letter: "A" | "B" | "C", name: string): Metadata {
  return {
    title: { absolute: `Homepage option ${letter}: ${name} | Mocean Beach Resort` },
    robots: { index: false, follow: false },
  };
}
