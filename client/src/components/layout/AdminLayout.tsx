import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarDays, CalendarCheck, Users, Package, Layers, Star, Image as ImageIcon, Inbox, Settings, LogOut, Euro } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

/**
 * De zijbalk is gegroepeerd en niet één lange lijst.
 *
 * Elf gelijkwaardige items op een rij lees je niet, je scant ze — en dan zoek je "Reviews" elke
 * keer opnieuw. Drie groepen met een kopje maken er drie korte lijstjes van, en de kopjes zeggen
 * waaróm iets bij elkaar hoort: waar je de dag mee doorkomt, waar het geld zit, en wat er op de
 * site staat.
 *
 * Het actieve item krijgt een saliestreepje links en een zachte saliewassing. Zie de
 * kleurtaal in `index.css`: salie is merk en navigatie.
 */

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const GROEPEN: Array<{ kop: string; items: NavItem[] }> = [
  {
    kop: "Werk",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/admin/boekingen", label: "Boekingen", icon: CalendarCheck },
      { href: "/admin/aanvragen", label: "Aanvragen", icon: Inbox },
    ],
  },
  {
    kop: "Geld",
    items: [
      { href: "/admin/omzet", label: "Omzet", icon: Euro },
      { href: "/admin/klanten", label: "Klanten", icon: Users },
    ],
  },
  {
    kop: "Inhoud",
    items: [
      { href: "/admin/pakketten", label: "Pakketten", icon: Layers },
      { href: "/admin/producten", label: "Taart-prijslijst", icon: Package },
      { href: "/admin/galerij", label: "Galerij", icon: ImageIcon },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/instellingen", label: "Instellingen", icon: Settings },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-linen/60 flex">
      <aside className="hidden md:flex flex-col w-64 border-r border-charcoal/10 bg-white">
        <div className="border-b border-sage/20 bg-linen/50 p-6">
          <Link href="/" className="block">
            <div className="font-display text-xl">Atelier</div>
            <div className="script-accent text-2xl leading-none -mt-1">Boterbloem</div>
          </Link>
          <div className="tag mt-1.5">Admin</div>
        </div>

        <nav className="flex-1 space-y-5 p-3">
          {GROEPEN.map((groep) => (
            <div key={groep.kop}>
              <div className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-charcoal/40">
                {groep.kop}
              </div>
              <div className="space-y-0.5">
                {groep.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.exact
                    ? location === item.href
                    : location === item.href || location.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md py-2.5 pl-4 pr-3 text-sm transition-colors",
                        active
                          ? "bg-sage/25 font-medium text-charcoal"
                          : "text-charcoal/70 hover:bg-linen hover:text-charcoal",
                      )}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-sage-deep"
                        />
                      )}
                      <Icon size={18} className={active ? "text-sage-dark" : "text-charcoal/45"} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-charcoal/10 bg-linen/40 p-4">
          <div className="text-xs text-charcoal/50 mb-2">Ingelogd als</div>
          <div className="text-sm font-medium truncate">{user?.name || user?.username}</div>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/admin/login") })}
            className="mt-3 inline-flex items-center gap-2 text-xs text-charcoal/60 transition-colors hover:text-burgundy"
          >
            <LogOut size={14} /> Uitloggen
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between border-b border-sage/20 bg-white px-4 py-3">
          <div className="font-display text-lg">
            Boterbloem <span className="tag">Admin</span>
          </div>
          <button
            aria-label="Uitloggen"
            className="text-charcoal/60 transition-colors hover:text-burgundy"
            onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/admin/login") })}
          >
            <LogOut size={18} />
          </button>
        </header>
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full">{children}</main>
      </div>
    </div>
  );
}
