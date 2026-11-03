import facts from "@/data/facts.json";

type Fact = { label: string; value: string; unit?: string };

const pages = facts.pages as Record<string, Fact[]>;
// Per page path, then section id: the copied pages reuse section ids (e.g. "desert-point" on several surf pages).
const sites = facts.sites as Record<string, Record<string, Fact[]>>;

/**
 * Logbook redesign (MASTER.md): key figures taken from a page's or dive site's own text
 * (src/data/facts.json). Hidden in the original design ("?original").
 */
function FactList({ items, className }: { items: Fact[]; className: string }) {
  return (
    <dl className={`rd-facts ${className}`} style={{ "--rd-facts": items.length } as React.CSSProperties}>
      {items.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          {/* Figures get the large numeric style; words like "Experienced" a smaller one. */}
          <dd className={/\d/.test(fact.value) ? undefined : "word"}>
            {fact.value}
            {fact.unit && <small>{fact.unit}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Ink strip of figures directly under the hero. */
export function PageFacts({ path }: { path: string }) {
  const items = pages[path];
  if (!items) return null;
  return (
    <div className="rd-only rd-facts-bar">
      <FactList items={items} className="bar" />
    </div>
  );
}

/** Spec row of a dive site, placed after its intro text. */
export function SiteFacts({ path, id }: { path: string; id: string }) {
  const items = sites[path]?.[id];
  if (!items || items.length < 2) return null;
  return <FactList items={items} className="rd-only spec" />;
}

export const hasSiteFacts = (path: string, id?: string) => !!id && (sites[path]?.[id]?.length ?? 0) >= 2;
