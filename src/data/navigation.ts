/**
 * Main menu, copied from the original RT Mega Menu ("Main Menu").
 * `href: null` = the original item links to "#" (it only opens a dropdown).
 */
export type MenuItem = {
  label: string;
  href: string | null;
  children?: MenuItem[];
};

export const mainMenu: MenuItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Visit & Stay",
    href: null,
    children: [
      { label: "Beach Resort", href: "/tropical-beach-resort/" },
      { label: "Accommodation", href: "/accommodation/" },
      { label: "Restaurant", href: "/restaurant/" },
      { label: "Transfer", href: "/travel-lombok-sumbawa/" },
      { label: "Dive Holidays", href: "/diving-trips/" },
    ],
  },
  {
    label: "Go Surfing",
    href: null,
    children: [
      { label: "Surf Lesson", href: "/surf-lesson/" },
      { label: "Surf Trip", href: "/surf-trip/" },
    ],
  },
  {
    label: "Go Diving",
    href: null,
    children: [
      {
        label: "Padi Courses",
        href: "/scuba-diving/",
        children: [
          { label: "Discover Scuba Diving", href: "/discover-scuba-diving/" },
          { label: "Padi Open Water", href: "/scuba-diving/padi-open-water/" },
          { label: "Padi Advanced Open Water", href: "/scuba-diving/padi-advanced-open-water/" },
          { label: "Rescue Diver", href: "/scuba-diving/rescue-diver/" },
        ],
      },
      { label: "Daily Fun Dives", href: "/fun-diving/" },
      { label: "Snorkeling", href: "/snorkeling/" },
      { label: "Night Diving", href: "/scuba-diving/night-diving/" },
      { label: "Dive Resort", href: "/dive-resort/" },
    ],
  },
  {
    label: "Aquatic Wild Life",
    href: null,
    children: [
      { label: "Manta Rays", href: "/manta-rays/" },
      { label: "Coral Reefs", href: "/coral-reefs/" },
    ],
  },
  {
    label: "Tour & Activity",
    href: "/sumbawa-indonesia/",
    children: [
      { label: "Agal Waterfall", href: "/sumbawa-indonesia-tour/agal-waterfall/" },
      { label: "Rice Field Walk", href: "/sumbawa-indonesia-tour/rice-field-walk/" },
      { label: "Danau Lebo Taliwang", href: "/sumbawa-indonesia-tour/danau-lebo/" },
      { label: "Kalela Waterfall", href: "/kalela-waterfall/" },
    ],
  },
  { label: "Pricing", href: "/pricing/" },
  { label: "Contact", href: "/contact/" },
];

/** Footer column "Surf and Dive Guide" (two inline rows, as in the original). */
export const footerGuideLinks: MenuItem[][] = [
  [
    { label: "Dive Sites", href: "/dive-sites/" },
    { label: "Surf Spots", href: "/surf-spots/" },
  ],
  [
    { label: "News", href: "/news/" },
    { label: "Seasonal Diving", href: "/seasonal-diving/" },
  ],
];
