import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Een paneel dat van rechts inschuift over het scherm waar je al was.
 *
 * Waarom een sheet en geen pagina: je opent een boeking bijna altijd *vanuit* iets — de agenda,
 * de lijst, de aanvragen. Een pagina haalt je daar weg en de terugknop moet je terugbrengen.
 * Een sheet laat de agenda op de achtergrond staan, zodat je na het sluiten nog steeds naar
 * dezelfde week kijkt.
 *
 * Gebouwd op `@radix-ui/react-dialog`, dat al in `package.json` stond maar nergens gebruikt
 * werd. Dat levert focus-trap, sluiten met Escape, scroll-lock op de achtergrond en de juiste
 * `aria`-attributen — allemaal dingen die je met een `<div>` met `position: fixed` zelf moet
 * bouwen en waarvan je de helft vergeet.
 *
 * De animatie zit in `index.css` en valt weg onder `prefers-reduced-motion`.
 */

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Grote regel bovenaan — bij een boeking het boekingsnummer. */
  title: ReactNode;
  /** Kleinere regel eronder: datum, tijd, herkomst. */
  subtitle?: ReactNode;
  /** Rechts naast de titel, bijvoorbeeld de statuskeuze. */
  headerRight?: ReactNode;
  /** Vaste balk onderaan die niet meescrolt. */
  footer?: ReactNode;
  /** Breed genoeg voor een regeltabel met vier kolommen. */
  width?: "md" | "lg";
  children: ReactNode;
};

const BREEDTE = {
  md: "sm:max-w-[480px]",
  lg: "sm:max-w-[560px]",
} as const;

export function Sheet({
  open,
  onOpenChange,
  title,
  subtitle,
  headerRight,
  footer,
  width = "lg",
  children,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-sm data-[state=open]:animate-sheet-fade" />

        {/* Op een telefoon volle breedte: 560 px past daar niet op (scenario 50). */}
        <Dialog.Content
          className={`fixed inset-y-0 right-0 z-50 flex w-full ${BREEDTE[width]} flex-col
            bg-linen shadow-2xl outline-none data-[state=open]:animate-sheet-in`}
        >
          <header className="flex items-start gap-3 border-b border-charcoal/10 bg-white/60 px-5 py-4">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-xl leading-tight text-charcoal">
                {title}
              </Dialog.Title>
              {subtitle && (
                // `break-words`: een lang e-mailadres mag de kop niet oprekken (scenario 97).
                <Dialog.Description className="mt-0.5 break-words text-sm text-charcoal/75">
                  {subtitle}
                </Dialog.Description>
              )}
            </div>

            {headerRight}

            <Dialog.Close
              className="-mr-1 shrink-0 rounded-full p-2 text-charcoal/70 transition hover:bg-charcoal/5 hover:text-charcoal"
              aria-label="Sluiten"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

          {footer && (
            <footer className="flex items-center gap-2 border-t border-charcoal/10 bg-white/60 px-5 py-3">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Sectiekop binnen een sheet: klein, salie, wijd gespatieerd.
 *
 * Rust kwam van ruimte alleen, en dat bleek te weinig — een sheet met zeven secties las als één
 * doorlopende lap tekst. Nu een saliestreepje voor de kop en een haarlijn erna, zodat de
 * secties zichtbaar uit elkaar vallen zonder dat het een formulier wordt. Zwaardere lijnen
 * houden we voor de regeltabel en de tijdlijn, waar ze betekenis dragen.
 */
export function SheetSectie({
  titel,
  actie,
  children,
}: {
  titel: string;
  actie?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-7 last:mb-0">
      <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-sage/20 pb-1.5">
        <h3 className="tag flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-0.5 rounded-full bg-sage" />
          {titel}
        </h3>
        {actie}
      </div>
      {children}
    </section>
  );
}
