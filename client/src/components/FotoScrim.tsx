/**
 * Het donkere verloop onder tekst die op een foto staat.
 *
 * Stond in drievoud in de pagina's als `from-charcoal/55 via-transparent to-transparent` over
 * de **hele** tegel. Dat gaat mis zodra de foto licht is: `via-transparent` laat het verloop
 * al op halve hoogte helemaal wegvallen, dus onderin blijft er te weinig over om witte tekst
 * op een witte taart leesbaar te houden. Op een donkere foto viel dat niet op, en dus is het
 * blijven staan.
 *
 * Nu over het onderste deel in plaats van de hele tegel, en met een middenstop die niet
 * doorzichtig is. Dat geeft onderin genoeg dekking en laat de foto er bovenin ongemoeid.
 */
export function FotoScrim() {
  return (
    <div
      aria-hidden
      // `z-30`: de foto's eronder krijgen `z-10`/`z-20` om zonder dip te kunnen kruisvervagen
      // (zie `FotoCyclus`). Zonder deze laag zou de foto over het verloop en de titel heen
      // vallen, want een element met een z-index wint van een later broertje zonder.
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-3/5 bg-gradient-to-t from-charcoal/90 via-charcoal/45 to-transparent"
    />
  );
}

/**
 * Tekstschaduw voor een kop op een foto. Het verloop doet het meeste werk; dit vangt de
 * uitschieters op, zoals een fel hooglicht precies achter een letter.
 */
export const FOTO_TEKST_SCHADUW = "[text-shadow:0_1px_8px_rgba(31,29,27,0.55)]";
