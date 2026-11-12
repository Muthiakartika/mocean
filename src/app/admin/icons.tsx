/** Line icons of the admin (one set, 24px grid, 1.8 stroke). Decorative: the text next to them carries the meaning. */
type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className ?? "adm-icon"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="3.5" width="7" height="8" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
    <rect x="3.5" y="14.5" width="7" height="6" rx="2" />
  </Svg>
);

export const BookingsIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5.5a2.5 2.5 0 0 0 0-5Z" />
    <path d="M14 4.5v2M14 10v4M14 17.5v2" />
  </Svg>
);

export const CalendarIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
  </Svg>
);

export const BlockIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </Svg>
);

export const RatesIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 12.2V5a1.5 1.5 0 0 1 1.5-1.5h7.2a2 2 0 0 1 1.4.6l6.8 6.8a2 2 0 0 1 0 2.8l-6.5 6.5a2 2 0 0 1-2.8 0l-6.8-6.8a2 2 0 0 1-.8-1.2Z" />
    <circle cx="8.5" cy="8.5" r="1.5" />
  </Svg>
);

export const ChartIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 20h16" />
    <rect x="5.5" y="11" width="3.5" height="6.5" rx="1" />
    <rect x="10.5" y="6.5" width="3.5" height="11" rx="1" />
    <rect x="15.5" y="13.5" width="3.5" height="4" rx="1" />
  </Svg>
);

export const PlusIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const SearchIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Svg>
);

export const LogoutIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </Svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const HourglassIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M6.5 3.5h11M6.5 20.5h11" />
    <path d="M7.5 3.5c0 4 4.5 5.5 4.5 8.5S7.5 16.5 7.5 20.5M16.5 3.5c0 4-4.5 5.5-4.5 8.5s4.5 4.5 4.5 8.5" />
  </Svg>
);

export const ArrivalIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M10 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M14 16.5 18.5 12 14 7.5M18.5 12H9" />
  </Svg>
);

export const DepartureIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M9.5 16.5 5 12l4.5-4.5M5 12h9.5" />
  </Svg>
);

export const BedIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3 18.5V6.5M3 14h18v4.5M21 14v-2.5a3 3 0 0 0-3-3h-7V14" />
    <circle cx="7" cy="10.5" r="2" />
  </Svg>
);

export const CheckIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const AlertIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5.5M12 16.2v.3" />
  </Svg>
);
