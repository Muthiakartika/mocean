---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/home-a/page.tsx","src/app/home-b/page.tsx","src/app/home-c/page.tsx"]
---

## Scope

Homepage of moceanbeachresort.com. Mode: Persuade. Three option pages built side by side for the owner to choose from (2026-11-03): `/home-a`, `/home-b`, `/home-c` (noindex, not in the sitemap). The chosen one replaces `src/app/page.tsx`; the other two are deleted.

## Brief

- Audience: couples and slow-holiday guests first, divers and surfers weighted equally (owner answer).
- Action: send dates on WhatsApp; Cloudbeds and email as alternatives.
- Proof: own photography, room rates, dive price, location and transfer facts, two Google reviews.
- Owner's complaints about the current page: looks like a template; too long, too much text. Each option stays short and lets facts and photos carry it.
- Constraints: no new claims or numbers; copy is cut down from `src/data/homepage.ts`, not invented. New visual worlds allowed (not tied to Logbook). Global header and footer are replaced inside each option by its own; floating WhatsApp / Cloudbeds buttons stay.
- Seed key: 5f380ed3 (direction scope, persuade). Code-led: no image generation on this machine.

## Direction contract

### Option A: The day board (assigned direction, list position 4)

THESIS: The homepage is the enamel board by the dive center where the day gets written up in marker: dive, surf, pool, dinner, rooms and prices on one board. Refuses the drone hero over alternating text and photo blocks.
OWN-WORLD: Cool white enamel inside a brushed aluminium frame, pale blue printed ruling, dry-erase marker in navy, black and one red reserved for the single thing needing attention (the WhatsApp circle). Yellow magnets hold white-bordered photo prints. Printed labels in extra-condensed caps, entries in a felt-pen hand. One marker stroke weight for every rule, underline and arrow. Columns of the board never move on desktop.
STORY: The visitor sees that diving, surfing and doing nothing fit in one stay at a ten-room place, reads what it costs and how to get there, and messages dates.
FIRST VIEWPORT: Aluminium top rail with logo, five links, WhatsApp. Board fills the screen: large pinned print of the beach left, headline in marker right, four board columns (Dive, Surf, Slow, Eat) as one-line entries below, red circle around the WhatsApp button.
FORM: Hospitality ephemera; grounded list position 4; seed 5f380ed3.
RAISES: from the clear-line album, one unvarying stroke weight; from the split-flap board, fixed ruled columns as the whole composition; from the botanical folio, every print at one registered size and baseline; from the paper automata, red reserved for the one element in focus.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

### Option B: Chart of the Alas Strait (Impeccable's pick, list position 1)

THESIS: The homepage is a nautical chart of the water between Lombok and Sumbawa with Mocean plotted on it: where it is, how you get there and what breaks in front of it come before any adjective. Refuses the drone hero and the centered resort name.
OWN-WORLD: Chart paper white, banded shallow-water blues, buff land, a fine black coastline, chart magenta reserved for the resort, routes and note marks. Sloping italic serif for water names, tracked upright sans caps for land, graticule ticks with real coordinates on the border, a compass rose, an inset plan holding the aerial photo. Notes and tables follow chart conventions.
STORY: The visitor finds the resort, sees the ferry and the pickup, reads the numbered chart notes (stay, dive, surf, eat, seasons) that the marks on the chart point to, and messages dates.
FIRST VIEWPORT: Full-bleed chart with border ticks. Title cartouche upper left holding name, one line of offer, WhatsApp button and rates link. Resort mark on Pantai Moro, dashed ferry route Kayangan to Poto Tano, dotted road to the resort, arrow to Sumbawa Besar airport off the east edge, Northern Rights breaker offshore.
FORM: Cartography; grounded list position 1; seed 5f380ed3.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

### Option C: Reel (challenger: hand-processed 16mm film, competitive on audience identification)

THESIS: The homepage is a reel of colour 16mm film shot at Mocean: the resort's photographs are the frames on a sprocket strip, the facts are printed in the edge codes, and the frame in the gate flares orange like late light on Pantai Moro. Refuses the slider hero by making the strip itself the page.
OWN-WORLD: Leader-black ground, base-grey rebates with sprocket holes, emulsion-grey secondary text, warm white type, light-leak orange reserved for the active frame and the primary button, sepia grease-pencil numerals. Tall condensed caps for display, tracked condensed caps for edge codes, a plain grotesk for reading. Fine grain over everything, photos stay in full colour.
STORY: The visitor watches the stay go past frame by frame (beach, room, boat, reef, wave, table), reads the edge-coded facts, then the rates and the way there, and messages dates.
FIRST VIEWPORT: Left: headline in tall condensed caps, one line on the ten rooms, orange WhatsApp tab. Right: vertical strip of three frames with sprocket holes, the middle frame flaring orange; a vertical edge code with the resort's coordinates runs down the left rail.
FORM: Challenger cinema-cinematography-editing-hand-processed-film-bloom, fused; competitive verdict; seed 5f380ed3.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

### Verdicts on the dealt hand

- Hand-processed 16mm film: competitive (audience identification: holiday film and surf film culture; weaker product clarity). Built as Option C.
- Split-flap concourse: declined. Kept: fixed ruled columns (raise on A).
- Ligne claire album: declined. Kept: one stroke weight (raise on A).
- Botanical folio: declined. Kept: registered print size and baseline (raise on A).
- Paper automata: declined. Kept: one colour reserved for the element in focus (raise on A).
- HyperCard stack: declined. Nothing kept.

## Unresolved

- Owner picks one option; then finish review and DESIGN.md for that world.
- Coastline in B comes from Natural Earth 1:10m (coarse at this scale); swap for OSM coastline if B is chosen.
