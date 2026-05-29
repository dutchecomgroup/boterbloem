import { Link } from "wouter";
import { demoImageForSlug } from "../../lib/demoGallery";
import { BotanicalPattern } from "../../components/ornaments/BotanicalPattern";
import { FloralFrame } from "../../components/ornaments/FloralFrame";
import { GoldDivider } from "../../components/ornaments/GoldDivider";
import { BotanicalCorner } from "../../components/ornaments/BotanicalCorner";
import { ArrowRight } from "lucide-react";

const SERVICES = [
  {
    slug: "bruidstaarten",
    title: "Bruidstaarten",
    accent: "Het hart van jullie dag",
    body: "Een sculpturale taart die past bij jullie verhaal — meerdere lagen, suikerbloemen, gouden accenten of strak en modern. We werken vanaf een persoonlijk ontwerpgesprek.",
  },
  {
    slug: "verjaardagstaarten",
    title: "Verjaardagstaarten",
    accent: "Voor wie iets bijzonders verdient",
    body: "Voor de jarige die iets bijzonders verdient. Klassiek, speels of thematisch — altijd vers en op smaak.",
  },
  {
    slug: "mini-desserts",
    title: "Mini desserts",
    accent: "Klein maar verfijnd",
    body: "Cheesecakejes, mousse-cupjes, tartelettes en macarons. Perfect voor sweet tables en borrels.",
  },
  {
    slug: "cupcakes",
    title: "Cupcakes",
    accent: "Bij de dozijn",
    body: "Klein maar verfijnd, in dozijnen of als showpiece-arrangement met seizoensgebonden topping.",
  },
  {
    slug: "party-setups",
    title: "Sweet tables & party setups",
    accent: "Een volledig tafereel",
    body: "Volledige dessertstyling — van taart tot tafelopstelling, inclusief glaswerk en stands.",
  },
  {
    slug: "overig",
    title: "Op maat & overig",
    accent: "Heb je een ander idee?",
    body: "Doopsuiker, babyshowers, bedrijfsevents, jubilea. Heb je een ander idee? Bespreek het met ons.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="relative bg-section-warm overflow-hidden pt-10 sm:pt-20 pb-10 sm:pb-16">
        <BotanicalPattern opacity={0.05} />
        <FloralFrame className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 sm:w-56 md:w-80 h-32 sm:h-56 md:h-80" color="text-gold/20" />
        <FloralFrame className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12 rotate-180 w-24 sm:w-40 md:w-64 h-24 sm:h-40 md:h-64" color="text-blush" />
        <div className="container-tight relative">
          <div className="tag mb-3">Aanbod</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl">Onze diensten</h1>
          <div className="mt-4 mb-4 sm:mt-6 sm:mb-6"><GoldDivider className="!mx-0 !max-w-[180px]" /></div>
          <p className="text-charcoal/70 max-w-2xl leading-relaxed text-sm sm:text-base">
            Elke creatie is op maat. Onderstaande categorieën geven een idee van wat we doen — maar het echte werk begint met jouw verhaal.
          </p>
        </div>
      </section>

      <section className="relative bg-cream section-y overflow-hidden">
        <BotanicalPattern opacity={0.04} />
        <div className="container-tight relative">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {SERVICES.map((s, i) => {
              const img = demoImageForSlug(s.slug);
              return (
                <Link
                  key={s.slug}
                  href={`/galerij/${s.slug}`}
                  className={`group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all ring-1 ring-gold/10 block ${
                    i % 3 === 0 ? "md:row-span-2" : ""
                  }`}
                >
                  {img && (
                    <div className="relative overflow-hidden aspect-[16/10]">
                      <img
                        src={img}
                        alt={s.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 text-cream script-accent text-2xl drop-shadow">
                        {s.accent}
                      </div>
                    </div>
                  )}
                  <div className="p-5 sm:p-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl mb-3 group-hover:text-gold-dark transition-colors">{s.title}</h2>
                    <p className="text-charcoal/70 leading-relaxed text-sm">{s.body}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold-dark">
                      Bekijk werk <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-section-blush section-y overflow-hidden">
        <BotanicalPattern opacity={0.05} />
        <BotanicalCorner position="tl" color="text-gold/30" />
        <BotanicalCorner position="br" color="text-gold/30" />
        <div className="container-narrow relative text-center">
          <div className="script-accent text-4xl sm:text-5xl mb-4 leading-none">Klaar om te bestellen?</div>
          <p className="text-charcoal/70 mb-8 leading-relaxed text-sm sm:text-base">
            Laat ons jouw idee horen. We werken samen aan een ontwerp dat helemaal bij jouw moment past.
          </p>
          <Link href="/contact" className="btn-gold">Vraag een offerte aan</Link>
          <div className="mt-8 sm:mt-10"><GoldDivider /></div>
        </div>
      </section>
    </>
  );
}
