/**
 * Shared CSS that the original site loads AFTER each page's own Elementor CSS
 * (theme stylesheets, Essential Addons, lightbox). Imported by every inner page
 * route after its post-<id>.css — see ./styles.ts for the first part.
 */
import "@/styles/elementor/vendor/theme-style.css";
import "@/styles/elementor/vendor/bootstrap-grid.css";
import "@/styles/elementor/vendor/theme-responsive.css";
import "@/styles/elementor/vendor/widget-social-icons.css";
import "@/styles/elementor/vendor/essential-addons.css";
import "@/styles/elementor/vendor/dialog.css";
import "@/styles/elementor/vendor/lightbox.css";
import "@/styles/elementor/wp-custom-css.css";
import "@/styles/elementor/elementor-fixes.css";
// Redesign layer (MASTER.md); "?original" in the URL switches it off.
import "@/styles/redesign/tokens.css";
import "@/styles/redesign/inner-pages.css";
