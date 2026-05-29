import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Instagram } from "lucide-react";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { cn } from "../../lib/utils";
import { BotanicalPattern } from "../ornaments/BotanicalPattern";
import { GoldDivider } from "../ornaments/GoldDivider";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/galerij", label: "Galerij" },
  { href: "/diensten", label: "Aanbod" },
  { href: "/over", label: "Over" },
  { href: "/contact", label: "Contact" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { data: settings } = usePublicSettings();
  const contact = settings?.contact;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-charcoal/5">
        <div className="container-tight flex items-center justify-between h-20">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-display text-2xl tracking-tight">Atelier</span>
            <span className="script-accent text-3xl leading-none -mt-1">Boterbloem</span>
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
                    active ? "text-gold-dark" : "text-charcoal/70 hover:text-charcoal",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 h-px bg-gold transition-all duration-300",
                      active ? "w-8 opacity-100" : "w-0 opacity-0 group-hover/nav:w-6 group-hover/nav:opacity-70",
                    )}
                  />
                </Link>
              );
            })}
            <Link href="/contact" className="btn-gold !py-2 !px-5 text-xs">Offerte aanvragen</Link>
          </nav>
          <button className="md:hidden p-2" onClick={() => setOpen(true)} aria-label="Menu openen">
            <Menu size={24} />
          </button>
        </div>
        {open && (
          <div className="md:hidden fixed inset-0 bg-cream z-50">
            <div className="container-tight flex items-center justify-between h-20">
              <span className="font-display text-2xl">Atelier <span className="script-accent text-3xl">Boterbloem</span></span>
              <button className="p-2" onClick={() => setOpen(false)} aria-label="Menu sluiten">
                <X size={24} />
              </button>
            </div>
            <nav className="container-tight flex flex-col gap-6 mt-12">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-2xl font-display tracking-tight"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setOpen(false)} className="btn-gold mt-4 w-fit">
                Offerte aanvragen
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="relative bg-charcoal text-cream mt-24 overflow-hidden">
        <BotanicalPattern opacity={0.06} className="text-cream" />
        <div className="container-tight relative py-16 grid gap-12 md:grid-cols-3">
          <div>
            <div className="font-display text-2xl">Atelier <span className="script-accent text-3xl">Boterbloem</span></div>
            <p className="mt-4 text-cream/70 text-sm leading-relaxed max-w-xs">
              Handgemaakte taarten, mini desserts en zoete creaties voor jouw mooiste momenten.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-cream/80">
              {contact?.email && <li><a href={`mailto:${contact.email}`} className="hover:text-gold">{contact.email}</a></li>}
              {contact?.phone && <li><a href={`tel:${contact.phone}`} className="hover:text-gold">{contact.phone}</a></li>}
              {contact?.address && <li>{contact.address}{contact.city ? `, ${contact.city}` : ""}</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-gold mb-4">Volg ons</h4>
            <a
              href={contact?.instagram ?? "https://instagram.com/atelierboterbloem"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:text-gold"
            >
              <Instagram size={18} /> @atelierboterbloem
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="container-tight">
            <GoldDivider className="!text-gold/40 py-4" />
          </div>
          <div className="py-6 text-center text-xs text-cream/40 relative">
            © {new Date().getFullYear()} Atelier Boterbloem. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
}
