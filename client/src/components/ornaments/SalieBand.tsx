/**
 * Een smalle salie-band die twee secties van elkaar scheidt.
 *
 * **Waarom hij bestaat.** De homepage wisselde zeven keer van achtergrondvlak, en vier van die
 * tinten lagen zo dicht bij elkaar dat de wissel niet als ritme las maar als onrust. In de
 * woorden van de gebruiker: *"ik zie hier gewoon 5 kleuren"* en *"het design moet overvloeien,
 * niet hard afkappen, en ook niet 3 door elkaar heen"*.
 *
 * De oplossing kwam uit zijn eigen voorstel: *"tussenblokken van die groene die er nu ook is"*.
 * Deze band neemt de rol over die de kleurwissel had. Daarmee blijft de regel uit het
 * design-systeem overeind -- twee aangrenzende secties nooit hetzelfde vlak -- maar grenzen
 * secties met hetzelfde vlak niet meer aan elkaar, dus mogen ze doorlopen. Zeven wissels werden
 * er vier.
 *
 * **Geen tweede marquee.** De band bovenaan (`Marquee`) draagt trefwoorden en beweegt; dat is
 * één keer een aankondiging en drie keer een tic. Deze band staat stil en draagt alleen het
 * ornament uit haar moodboard.
 *
 * De hoogte is bewust kleiner dan die van de marquee (70 px): dit is een naad, geen blok.
 */
export function SalieBand({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-10 items-center justify-center overflow-hidden bg-sage-deep sm:h-12 ${className}`}
      aria-hidden
    >
      {/* Hetzelfde teken als tussen de trefwoorden in de marquee, zodat de twee banden als
          familie lezen. Linen op sage-deep haalt 5,04:1; op /45 draagt het geen tekst maar
          alleen vorm, en dat mag zachter. */}
      <span className="font-display text-lg italic leading-none text-linen/45 sm:text-xl">❦</span>
    </div>
  );
}
