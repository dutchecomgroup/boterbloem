import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

/**
 * Een WhatsApp-link uit een nummer zoals iemand het opschrijft.
 *
 * `wa.me` wil alleen cijfers met landnummer, zonder plus, zonder spaties. Maar in het
 * beheerscherm typt iemand "06 12 34 56 78", en dat hoort gewoon te werken: een veld dat een
 * bepaald formaat eist zonder dat te zeggen, levert een stille kapotte link op.
 *
 * Een nummer dat met `0` begint is Nederlands, dus die nul wordt `31`. Staat er al een
 * landnummer, dan blijft dat staan.
 */
export function whatsappLink(nummer: string | null | undefined): string | null {
  if (!nummer) return null;
  const cijfers = nummer.replace(/\D/g, "");
  if (cijfers.length < 8) return null;
  const metLand = cijfers.startsWith("0") ? `31${cijfers.slice(1)}` : cijfers;
  return `https://wa.me/${metLand}`;
}

/**
 * "15–40 personen", "vanaf 40 personen", "tot 40 personen", of `null` als geen van beide
 * grenzen is ingevuld.
 *
 * Stond eerst als `{min ?? "?"}–{max ?? "meer"}` in de pagina's. Wie alleen een bovengrens
 * invulde kreeg daardoor **`?–40 personen`** op de publieke site te zien; het vraagteken was
 * bedoeld als opvulling voor de beheerder maar lekte naar de bezoeker. Een half ingevuld
 * bereik is geen fout, dus het hoort een leesbare zin op te leveren en niet een gat.
 *
 * `0` wordt als ingevuld beschouwd — vandaar `!= null` en niet een waarheidstest.
 */
export function personenBereik(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min != null && max != null) return `${min}–${max} personen`;
  if (min != null) return `vanaf ${min} personen`;
  if (max != null) return `tot ${max} personen`;
  return null;
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(date);
}

export function formatDateShort(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
