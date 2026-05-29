import { Link } from "wouter";

const SERVICES = [
  {
    slug: "bruidstaarten",
    title: "Bruidstaarten",
    body: "Een sculpturale taart die past bij jullie verhaal — meerdere lagen, suikerbloemen, gouden accenten of strak en modern. We werken vanaf een persoonlijk ontwerpgesprek.",
  },
  {
    slug: "verjaardagstaarten",
    title: "Verjaardagstaarten",
    body: "Voor de jarige die iets bijzonders verdient. Klassiek, speels of thematisch — altijd vers en op smaak.",
  },
  {
    slug: "mini-desserts",
    title: "Mini desserts",
    body: "Cheesecakejes, mousse-cupjes, tartelettes en macarons. Perfect voor sweet tables en borrels.",
  },
  {
    slug: "cupcakes",
    title: "Cupcakes",
    body: "Klein maar verfijnd, in dozijnen of als showpiece-arrangement met seizoensgebonden topping.",
  },
  {
    slug: "party-setups",
    title: "Sweet tables & party setups",
    body: "Volledige dessertstyling — van taart tot tafelopstelling, inclusief glaswerk en stands.",
  },
  {
    slug: "overig",
    title: "Op maat & overig",
    body: "Doopsuiker, babyshowers, bedrijfsevents, jubilea. Heb je een ander idee? Bespreek het met ons.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="container-tight pt-16 pb-12">
        <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">Aanbod</div>
        <h1 className="text-5xl md:text-6xl">Onze diensten</h1>
        <p className="mt-6 text-charcoal/70 max-w-2xl leading-relaxed">
          Elke creatie is op maat. Onderstaande categorieën geven een idee van wat we doen — maar het echte werk begint met jouw verhaal.
        </p>
      </section>

      <section className="container-tight pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              href={`/galerij/${s.slug}`}
              className="card hover:shadow-md transition-shadow group block"
            >
              <h2 className="text-3xl mb-3 group-hover:text-gold-dark transition-colors">{s.title}</h2>
              <p className="text-charcoal/70 leading-relaxed text-sm">{s.body}</p>
              <span className="mt-4 inline-block text-xs uppercase tracking-widest text-gold-dark">
                Bekijk werk →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/contact" className="btn-gold">Vraag een offerte aan</Link>
        </div>
      </section>
    </>
  );
}
