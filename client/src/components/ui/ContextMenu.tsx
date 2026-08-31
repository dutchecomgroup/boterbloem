import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Een rechtermuisklik-menu op de plek van de cursor.
 *
 * Bewust niet Radix' `ContextMenu`: die wil per doelwit een `<Trigger>` om zich heen, en de
 * agenda heeft 35 dagvakjes met daarin een wisselend aantal boekingen. Dat zouden tientallen
 * triggers zijn die elk hun eigen menu-instantie meeslepen. Eén menu dat weet waar het staat,
 * plus wat er aangeklikt is, is hier eenvoudiger én sneller.
 *
 * Wat het wel doet wat je zelf snel vergeet: sluiten bij Escape, bij een klik ergens anders,
 * bij scrollen, en **binnen het scherm blijven** — een menu bij een dag rechtsonder in de
 * kalender valt anders half buiten beeld.
 */

export type MenuItem =
  | { soort: "kop"; label: string }
  | { soort: "scheiding" }
  | {
      soort: "actie";
      label: string;
      icoon?: ReactNode;
      onClick: () => void;
      gevaarlijk?: boolean;
    };

export type MenuPositie = { x: number; y: number; items: MenuItem[] } | null;

export function ContextMenu({ menu, sluiten }: { menu: MenuPositie; sluiten: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [plek, setPlek] = useState({ x: 0, y: 0 });

  // Meten ná het renderen maar vóór het schilderen, anders zie je het menu even op de
  // verkeerde plek staan en dan verspringen.
  useLayoutEffect(() => {
    if (!menu || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const marge = 8;
    setPlek({
      x: Math.min(menu.x, window.innerWidth - width - marge),
      y: Math.min(menu.y, window.innerHeight - height - marge),
    });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const bijToets = (e: KeyboardEvent) => e.key === "Escape" && sluiten();
    // `capture`: sluiten vóórdat de klik bij het onderliggende element aankomt, zodat een
    // klik naast het menu niet óók een dagvakje activeert.
    const bijKlik = () => sluiten();
    window.addEventListener("keydown", bijToets);
    window.addEventListener("click", bijKlik, true);
    window.addEventListener("scroll", bijKlik, true);
    window.addEventListener("resize", bijKlik);
    return () => {
      window.removeEventListener("keydown", bijToets);
      window.removeEventListener("click", bijKlik, true);
      window.removeEventListener("scroll", bijKlik, true);
      window.removeEventListener("resize", bijKlik);
    };
  }, [menu, sluiten]);

  if (!menu) return null;

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: plek.x, top: plek.y }}
      // De klik binnen het menu mag niet doorlekken naar de sluit-listener hierboven.
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 min-w-[220px] overflow-hidden rounded-md border border-charcoal/15 bg-white py-1 shadow-xl"
    >
      {menu.items.map((item, i) => {
        if (item.soort === "scheiding") {
          return <div key={i} className="my-1 h-px bg-charcoal/10" />;
        }
        if (item.soort === "kop") {
          return (
            <div
              key={i}
              className="truncate px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-charcoal/70"
            >
              {item.label}
            </div>
          );
        }
        return (
          <button
            key={i}
            role="menuitem"
            type="button"
            onClick={() => {
              item.onClick();
              sluiten();
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
              item.gevaarlijk
                ? "text-burgundy hover:bg-burgundy/10"
                : "text-charcoal hover:bg-linen"
            }`}
          >
            <span className="w-4 shrink-0 text-charcoal/60">{item.icoon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
