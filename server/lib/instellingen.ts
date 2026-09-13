import type { ZodTypeAny } from "zod";

/**
 * Wat er gebeurt met een opgeslagen waarde die niet door zijn schema komt: een rij die met de
 * hand is bewerkt, of die is achtergebleven uit een oudere vorm.
 *
 * - `standaard` voor de publieke site: een kapotte rij mag de pagina niet leegtrekken.
 * - `ruw` voor het beheerscherm: laat zien wat er écht staat. Wie daar opslaat, gaat door de
 *   validatie van de PUT-route; stil vervangen door standaardwaarden zou haar invoer wissen.
 */
export type BijOngeldig = "standaard" | "ruw";

/**
 * Vult elke instellingssleutel aan tot zijn volledige vorm, met de standaardwaarden uit het schema.
 *
 * **Waarom dit bestaat.** `site_settings` is jsonb, en een sleutel die nooit is opgeslagen heeft
 * geen rij. De publieke route vulde dat al aan, maar de admin-route gaf alleen de rijen terug die
 * er stonden. Bij de tekstsleutels van 13-09 betekende dat: de site toonde de teksten, en het
 * scherm om ze te wijzigen was leeg -- want die sleutels waren nog nooit bewaard. Nu doen beide
 * routes hetzelfde, vanaf één plek.
 */
export function vulInstellingenAan(
  schemas: Record<string, ZodTypeAny>,
  opgeslagen: ReadonlyMap<string, unknown>,
  bijOngeldig: BijOngeldig,
): Record<string, unknown> {
  const uit: Record<string, unknown> = {};
  for (const [sleutel, schema] of Object.entries(schemas)) {
    const rauw = opgeslagen.get(sleutel);
    const ontleed = schema.safeParse(rauw ?? {});
    if (ontleed.success) {
      uit[sleutel] = ontleed.data;
    } else {
      uit[sleutel] = bijOngeldig === "ruw" && rauw !== undefined ? rauw : schema.parse({});
    }
  }
  return uit;
}
