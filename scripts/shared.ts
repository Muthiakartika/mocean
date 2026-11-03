/** Settings shared by the screenshot and compare scripts. */

export const TARGETS = {
  original: "https://moceanbeachresort.com",
  // LOCAL_URL=http://localhost:3100 when port 3000 is taken by another project.
  local: process.env.LOCAL_URL ?? "http://localhost:3000",
} as const;

export type TargetName = keyof typeof TARGETS;

/** The five viewports required by the PRD (§2.2). */
export const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
  { name: "375", width: 375, height: 812 },
];

/** "/scuba-diving/padi-open-water/" -> "scuba-diving__padi-open-water", "/" -> "home" */
export function slugOf(urlPath: string): string {
  return urlPath.replace(/^\/|\/$/g, "").replace(/\//g, "__") || "home";
}
