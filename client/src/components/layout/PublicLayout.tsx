import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Instagram } from "lucide-react";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { cn, whatsappLink } from "../../lib/utils";
import { BotanicalPattern } from "../ornaments/BotanicalPattern";
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

  return (
    <div className="min-h-screen flex flex-col bg-linen">
      <header className="sticky top-0 z-40 bg-linen/90 backdrop-blur-md border-b border-charcoal/5">
        <div className="container-tight flex items-center justify-between h-16 sm:h-20">
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
          <button className="md:hidden p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setOpen(true)} aria-label="Menu openen">
            <Menu size={24} />
          </button>
        </div>
        {open && (
          <div className="md:hidden fixed inset-0 bg-linen z-50 overflow-y-auto">
            <div className="container-tight flex items-center justify-between h-16 sm:h-20 border-b border-charcoal/5">
              <span className="font-display text-xl">Atelier <span className="script-accent text-2xl">Boterbloem</span></span>
              <button className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setOpen(false)} aria-label="Menu sluiten">
                <X size={24} />
              </button>
            </div>
            <nav className="container-tight flex flex-col gap-1 mt-8">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-2xl font-display tracking-tight py-4 border-b border-charcoal/5"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setOpen(false)} className="btn-sage mt-8 w-fit">
                Offerte aanvragen
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative bg-charcoal text-linen mt-16 sm:mt-24 overflow-hidden">
        <BotanicalPattern opacity={0.06} className="text-linen" />
        <div className="container-tight relative py-10 sm:py-16 grid gap-8 sm:gap-12 md:grid-cols-3">
          <div>
            <div className="font-display text-2xl">Atelier <span className="script-accent text-3xl">Boterbloem</span></div>
            <p className="mt-4 text-linen/70 text-sm leading-relaxed max-w-xs">
              Handgemaakte sweet tables, grazing tables en taarten voor jouw mooiste momenten.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-sage mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-linen/80">
              {contact?.email && <li><a href={`mailto:${contact.email}`} className="hover:text-sage">{contact.email}</a></li>}
              {contact?.phone && <li><a href={`tel:${contact.phone}`} className="hover:text-sage">{contact.phone}</a></li>}
              {whatsappLink(contact?.whatsapp) && (
                <li><a href={whatsappLink(contact?.whatsapp)!} target="_blank" rel="noreferrer" className="hover:text-sage">WhatsApp</a></li>
              )}
              {contact?.address && <li>{contact.address}{contact.city ? `, ${contact.city}` : ""}</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-sage mb-4">Volg ons</h4>
            <a
              href={contact?.instagram ?? "https://instagram.com/atelierboterbloem"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:text-sage"
            >
              <Instagram size={18} /> @atelierboterbloem
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="container-tight">
            <SierDivider className="!text-sage/40 py-4" />
          </div>
          <div className="py-6 text-center text-xs text-linen/40 relative">
            © {new Date().getFullYear()} Atelier Boterbloem. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
}
