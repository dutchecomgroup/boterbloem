/**
 * Statuslabels en -kleuren van een contactaanvraag.
 *
 * De tegenhanger van `boeking.ts`, en om dezelfde reden: `STATUS_LABEL` stond in tweevoud in
 * `ContactRequestsPage` en `AanvraagSheet`, met de kleuren los daarvan in een ternaire keten
 * midden in de tabel. Dat loopt onvermijdelijk uit de pas — precies waar een gebruiker over
 * struikelt ("waarom is nieuw hier goud en daar grijs?").
 *
 * De kleuren volgen de kleurtaal uit `index.css`: butter vraagt om aandacht, groen is
 * afgehandeld, charcoal/40 is rustig.
 */

export const AANVRAAG_STATUSSEN = [
  "nieuw",
  "gelezen",
  "opgevolgd",
  "omgezet_naar_order",
] as const;

export type AanvraagStatus = (typeof AANVRAAG_STATUSSEN)[number];

export const AANVRAAG_LABEL: Record<string, string> = {
  nieuw: "Nieuw",
  gelezen: "Gelezen",
  opgevolgd: "Opgevolgd",
  omgezet_naar_order: "→ Boeking",
};

/**
 * `nieuw` krijgt butter en niet goud-vol: een nieuwe aanvraag vraagt om aandacht, en dat is
 * precies wat butter in de kleurtaal betekent. Vol goud trok in de lijst zoveel aandacht dat
 * de rest van de rij wegviel.
 */
export const AANVRAAG_KLEUR: Record<string, string> = {
  nieuw: "bg-butter text-charcoal",
  gelezen: "bg-charcoal/10 text-charcoal/70",
  opgevolgd: "bg-gold/25 text-charcoal",
  omgezet_naar_order: "bg-emerald-100 text-emerald-800",
};
