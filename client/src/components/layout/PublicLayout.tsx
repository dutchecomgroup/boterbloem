import { Link, useLocation } from "wouter";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, Instagram } from "lucide-react";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { useGescrolld } from "../../hooks/useGescrolld";
import { cn, whatsappLink } from "../../lib/utils";
import { FloralFrame } from "../ornaments/FloralFrame";
import { SalieBand } from "../ornaments/SalieBand";
import { SierDivider } from "../ornaments/SierDivider";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/galerij", label: "Galerij" },
  { href: "/aanbod", label: "Aanbod" },
  { href: "/werkwijze", label: "Werkwijze" },
  { href: "/over", label: "Over" },
  { href: "/contact", label: "Contact" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { data: settings } = usePublicSettings();
  const contact = settings?.contact;
  const voet = settings?.voettekst;
  const gescrold = useGescrolld();

  return (
    <div className="min-h-screen flex flex-col bg-linen">
      {/*
        De kopbalk zweeft over de pagina en is boven aan de pagina zelf onzichtbaar.

        Hij had altijd een eigen linen-vlak met een randje eronder, en dat botste op de sectie
        daaronder: die is warm op de homepage, blush op de galerij en zand op de contactpagina.
        Boven aan elke pagina stond daardoor een lichte streep waar het ene vlak hard overging in
        het andere -- drie kleuren over elkaar in de bovenste honderd pixels. Eén vaste kleur voor
        de balk lost dat niet op, want er is er geen die bij alle drie past.

        Nu loopt de sectie gewoon door áchter de navigatie: boven de vouw is er één doorlopend
        vlak, en de enige lijn die het onderbreekt is de groene band -- en die is bedoeld.

        `fixed` en niet `sticky`: een sticky balk neemt zijn eigen hoogte in de bladspiegel in, en
        dan begint de sectie eronder in plaats van erachter. De ruimte voor de navigatie zit
        daarom in de bovenmarge van de eerste sectie van elke pagina (`PageHeader`, `HeroCollage`).

        Zodra er inhoud onder de balk door schuift krijgt hij wél een vlak: dan moet de tekst van
        de navigatie leesbaar blijven boven op foto's en donkere vlakken.
      */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
          gescrold
            ? "border-b border-charcoal/5 bg-linen/90 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-tight flex items-center justify-between h-16 sm:h-20">
          {/*
            Alleen de getypte naam, geen logo.

            Het logo past hier niet: het woordmerk is 10% van de logohoogte, dus in een balk van
            64 px worden de letters een paar pixels hoog. Een los bloemetje ernaast las als een
            fragment. Op verzoek van de klant (13-09) staat het logo daarom alleen waar het groot
            genoeg is: in de voettekst en op /over.
          */}
          <Link href="/" className="flex items-baseline gap-1 sm:gap-2 group">
            <span className="font-display text-xl sm:text-2xl tracking-tight">Atelier</span>
            <span className="script-accent text-2xl sm:text-3xl leading-none -mt-1">Boterbloem</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((item) => {
              const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative text-sm uppercase tracking-widest transition-colors group/nav",
                    active ? "text-sage-dark" : "text-charcoal/70 hover:text-charcoal",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 h-px bg-sage transition-all duration-300",
                      active ? "w-8 opacity-100" : "w-0 opacity-0 group-hover/nav:w-6 group-hover/nav:opacity-70",
                    )}
                  />
                </Link>
              );
            })}
            <Link href="/contact" className="btn-sage !py-2 !px-5 text-xs">Offerte aanvragen</Link>
          </nav>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              className="md:hidden p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Menu openen"
            >
              <Menu size={24} />
            </Dialog.Trigger>

            {/*
              Via een portal, en niet als `fixed` kind van deze header.

              De header heeft `backdrop-blur-md`, en een backdrop-filter maakt van een element
              een containing block voor `position: fixed`. Het paneel stond eerder ín de header
              en `inset-0` viel daardoor terug op de 64 px hoge headerbalk: het menu werd
              bovenaan afgeknipt en klapte nergens naartoe uit. Radix rendert in `document.body`
              en heeft dat probleem niet -- plus focus-trap, Escape en scroll-lock, die je bij
              een handgemaakte `div` alle drie zelf moet bouwen.
            */}
            <Dialog.Portal>
              {/* De achtergrond blijft zichtbaar, maar wazig: je ziet waar je vandaan komt. */}
              <Dialog.Overlay className="md:hidden fixed inset-0 z-50 bg-charcoal/20 backdrop-blur-[3px] data-[state=open]:animate-sheet-fade" />

              {/*
                Halve breedte, met een ondergrens van 16rem. Op een telefoon van 375 px is de
                letterlijke helft 187 px, en daar breekt "Offerte aanvragen" over drie regels.
                De ondergrens houdt het menu leesbaar; op alles vanaf ~512 px is het precies de
                helft, zoals bedoeld.
              */}
              <Dialog.Content
                className="md:hidden fixed inset-y-0 right-0 z-50 flex w-1/2 min-w-[16rem] flex-col
                  border-l border-charcoal/10 bg-linen/70 shadow-2xl outline-none backdrop-blur-2xl
                  data-[state=open]:animate-sheet-in"
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>

                {/* De naam blijft staan waar hij ook in de balk stond, zodat het paneel niet
                    voelt als een los venster maar als een verlengstuk van de kop. Hij is
                    tevens de weg terug naar home. */}
                <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-charcoal/10 px-4 sm:h-20">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-col leading-none"
                  >
                    <span className="font-display text-base tracking-tight">Atelier</span>
                    <span className="script-accent -mt-0.5 text-xl leading-tight">Boterbloem</span>
                  </Link>
                  <Dialog.Close
                    className="-mr-2 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center p-2"
                    aria-label="Menu sluiten"
                  >
                    <X size={24} />
                  </Dialog.Close>
                </div>

                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-4 py-6">
                  {NAV.map((item) => {
                    const active =
                      location === item.href || (item.href !== "/" && location.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "border-b border-charcoal/5 py-3.5 font-display text-xl tracking-tight transition-colors",
                          active ? "text-sage-deep" : "text-charcoal hover:text-sage-deep",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/contact"
                    onClick={() => setOpen(false)}
                    className="btn-sage mt-6 w-full !px-3 text-[11px]"
                  >
                    Offerte aanvragen
                  </Link>
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Dezelfde band die op de homepage de secties scheidt, ook hier: de voettekst is zand en
          het blok erboven meestal charcoal, en dat is een kleurwissel. De regel geldt overal --
          een vlak wisselt alleen waar de band staat. In de layout en niet per pagina, zodat elke
          pagina op dezelfde manier afsluit. */}
      <SalieBand />

      {/*
        De voettekst is licht, niet charcoal.

        Hij stond op hetzelfde vlak als de slotsectie erboven, en las daardoor als een
        verlengstuk van die oproep in plaats van als afsluiting van de pagina -- twee donkere
        blokken op elkaar, met alleen een marge ertussen die als witte streep doorschemerde.

        Zand en niet linen: de pagina opent warm en sluit nu warm, en de voettekst houdt gewicht
        in plaats van weg te zweven. Het is bovendien een vlak dat al in het ritme zit, dus er
        komt geen kleur bij.

        🔴 Contrast, gemeten op zand (#E4DACA): charcoal haalt 10,5:1, maar `sage-deep` blijft
        op 4,08:1 steken -- onder de AA-eis van 4,5 voor kleine tekst. De kopjes staan daarom in
        charcoal en niet in groen. Het groen zit waar het geen tekst hoeft te dragen: in het
        motief en in de sierlijn.
      */}
      <footer className="relative bg-section-sand text-charcoal overflow-hidden">
        {/*
          De bloemtak uit de hero, niet het herhalende tegelpatroon.

          Dat patroon vulde het hele vlak met kleine takjes en las als behang: op 6% zag je het
          niet en op 40% ging het met de tekst concurreren. Deze tak is één sierlijke vorm die de
          hoek draagt -- hetzelfde ornament dat boven aan de pagina staat, zodat de voettekst als
          tegenhanger van de kop leest.

          Twee stuks, tegenover elkaar en de tweede gespiegeld, zodat ze de tekstkolommen
          omlijsten in plaats van er middenin te vallen.
        */}
        <FloralFrame
          className="absolute -left-10 -bottom-10 h-52 w-52 sm:h-72 sm:w-72"
          color="text-sage-dark/45"
        />
        <FloralFrame
          className="absolute -right-12 -top-12 h-44 w-44 rotate-180 sm:h-64 sm:w-64"
          color="text-sage-dark/35"
        />
        {/*
          Het volledige logo, gecentreerd, en groot genoeg om het woordmerk te lezen.

          Het woordmerk is maar 10% van de logohoogte (35 van 341 px). In een kolom naast de
          contactgegevens werd het een paar pixels hoog, en de losse bloem die er daarna stond las als
          een fragment. Op 150 px zijn de letters ~15 px: leesbaar, en de voettekst blijft lager dan
          met het logo op 190 px. Gekozen door de klant op 13-09, na een vergelijking op de live pagina.

          Kleur en niet het negatief: de voettekst is zand, en het negatief is linnen.
        */}
        <div className="container-tight relative pt-8 text-center sm:pt-10">
          <img
            src="/merk/logo.png"
            alt="Atelier Boterbloem"
            width={413}
            height={341}
            className="mx-auto h-[150px] w-auto"
          />
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-charcoal/70">{voet?.payoff}</p>
        </div>
        {/* Contact en Instagram gecentreerd onder het logo, zodat de voettekst één as heeft in plaats
            van een logo in het midden met kolommen die links beginnen. */}
        <div className="container-tight relative grid max-w-2xl gap-5 pb-6 pt-6 text-center sm:grid-cols-2 sm:gap-10">
          <div>
            <h4 className="text-xs uppercase tracking-widest text-charcoal/70 mb-2">{voet?.contactKop}</h4>
            <ul className="space-y-2 text-sm text-charcoal/80">
              {contact?.email && <li><a href={`mailto:${contact.email}`} className="hover:text-charcoal hover:underline">{contact.email}</a></li>}
              {contact?.phone && <li><a href={`tel:${contact.phone}`} className="hover:text-charcoal hover:underline">{contact.phone}</a></li>}
              {whatsappLink(contact?.whatsapp) && (
                <li><a href={whatsappLink(contact?.whatsapp)!} target="_blank" rel="noreferrer" className="hover:text-charcoal hover:underline">WhatsApp</a></li>
              )}
              {contact?.address && <li>{contact.address}{contact.city ? `, ${contact.city}` : ""}</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-charcoal/70 mb-2">{voet?.volgKop}</h4>
            <a
              href={contact?.instagram ?? "https://instagram.com/atelierboterbloem"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-charcoal/80 hover:text-charcoal hover:underline"
            >
              <Instagram size={18} /> @atelierboterbloem
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="container-tight">
            <SierDivider className="!text-sage-dark/70 py-2" />
          </div>
          <div className="pb-4 pt-2 text-center text-xs text-charcoal/55 relative">
            © {new Date().getFullYear()} Atelier Boterbloem. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
}
