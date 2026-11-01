"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainMenu, type MenuItem } from "@/data/navigation";
import styles from "./MainNav.module.css";

/** Font Awesome "angle-down" — the arrow used by RT Mega Menu. */
function ArrowDown({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true">
      <path d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
    </svg>
  );
}

/** True when this item (or one of its children) is the page we are on. */
function isActive(item: MenuItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  return item.children?.some((child) => isActive(child, pathname)) ?? false;
}

/** A menu label that is a link, or plain text when the original links to "#". */
function MenuLink({ item, className, onClick }: { item: MenuItem; className: string; onClick?: () => void }) {
  if (item.href === null) {
    return (
      <a href="#" className={className} onClick={(e) => e.preventDefault()}>
        {item.label}
        {item.children && <ArrowDown className={styles.arrow} />}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {item.label}
      {item.children && <ArrowDown className={styles.arrow} />}
    </Link>
  );
}

/* ---------------- Desktop dropdown menu ---------------- */

function DesktopSubMenu({ items, pathname }: { items: MenuItem[]; pathname: string }) {
  return (
    <ul className={styles.subMenu}>
      {items.map((item) => (
        <li key={item.label} className={styles.subItem}>
          <MenuLink item={item} className={`${styles.subLink} ${isActive(item, pathname) ? styles.current : ""}`} />
          {item.children && <DesktopSubMenu items={item.children} pathname={pathname} />}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Mobile off-canvas menu ---------------- */

function MobileItem({ item, pathname, onNavigate }: { item: MenuItem; pathname: string; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const linkClass = `${styles.mobileLink} ${item.href === pathname ? styles.current : ""}`;

  return (
    <li className={styles.mobileItem}>
      <div className={styles.mobileRow}>
        {item.href === null ? (
          // Items without a page open their sub-menu, like the original.
          <a href="#" className={linkClass} onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}>
            {item.label}
          </a>
        ) : (
          <Link href={item.href} className={linkClass} onClick={onNavigate}>
            {item.label}
          </Link>
        )}
        {item.children && (
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Close" : "Open"} ${item.label} submenu`}
            onClick={() => setExpanded(!expanded)}
          >
            <ArrowDown />
          </button>
        )}
      </div>
      {item.children && (
        <div className={`${styles.mobileSub} ${expanded ? styles.expanded : ""}`}>
          <div className={styles.mobileSubInner}>
            <ul>
              {item.children.map((child) => (
                <MobileItem key={child.label} item={child} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

/** Main navigation: hover dropdowns above 1024px, off-canvas sidebar at 1024px and below. */
export default function MainNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav aria-label="Main menu">
      {/* Desktop */}
      <div className={styles.desktop}>
        <ul className={styles.desktopList}>
          {mainMenu.map((item) => (
            <li key={item.label} className={styles.topItem}>
              <MenuLink item={item} className={`${styles.topLink} ${isActive(item, pathname) ? styles.current : ""}`} />
              {item.children && <DesktopSubMenu items={item.children} pathname={pathname} />}
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile & tablet */}
      <button type="button" className={styles.hamburger} aria-label="Open Menu" onClick={() => setOpen(true)}>
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect y="14" width="18" height="2" fill="#FFFFFF" />
          <rect y="7" width="18" height="2" fill="#FFFFFF" />
          <rect width="18" height="2" fill="#FFFFFF" />
        </svg>
      </button>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <div className={`${styles.sidebar} ${open ? styles.open : ""}`} aria-hidden={!open} inert={!open}>
        <button type="button" className={styles.close} aria-label="Close Menu" onClick={() => setOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" aria-hidden="true">
            <path d="M317.7 402.3c3.125 3.125 3.125 8.188 0 11.31c-3.127 3.127-8.186 3.127-11.31 0L160 267.3l-146.3 146.3c-3.127 3.127-8.186 3.127-11.31 0c-3.125-3.125-3.125-8.188 0-11.31L148.7 256L2.344 109.7c-3.125-3.125-3.125-8.188 0-11.31s8.188-3.125 11.31 0L160 244.7l146.3-146.3c3.125-3.125 8.188-3.125 11.31 0s3.125 8.188 0 11.31L171.3 256L317.7 402.3z" />
          </svg>
        </button>
        <ul className={styles.mobileList}>
          {mainMenu.map((item) => (
            <MobileItem key={item.label} item={item} pathname={pathname} onNavigate={() => setOpen(false)} />
          ))}
        </ul>
      </div>
    </nav>
  );
}
