import { Link, useLocation } from "wouter";
import { LayoutDashboard, CalendarCheck, Users, Package, Image as ImageIcon, Inbox, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/boekingen", label: "Boekingen", icon: CalendarCheck },
  { href: "/admin/aanvragen", label: "Aanvragen", icon: Inbox },
  { href: "/admin/klanten", label: "Klanten", icon: Users },
  { href: "/admin/producten", label: "Producten", icon: Package },
  { href: "/admin/galerij", label: "Galerij", icon: ImageIcon },
  { href: "/admin/instellingen", label: "Instellingen", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-cream/60 flex">
      <aside className="hidden md:flex flex-col w-64 border-r border-charcoal/10 bg-white">
        <div className="p-6 border-b border-charcoal/10">
          <Link href="/" className="block">
            <div className="font-display text-xl">Atelier</div>
            <div className="script-accent text-2xl leading-none -mt-1">Boterbloem</div>
          </Link>
          <div className="mt-1 text-xs uppercase tracking-widest text-charcoal/40">Admin</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? location === item.href : location === item.href || location.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-gold/10 text-gold-dark font-medium" : "text-charcoal/70 hover:bg-charcoal/5",
                )}
              >
                <Icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-charcoal/10">
          <div className="text-xs text-charcoal/50 mb-2">Ingelogd als</div>
          <div className="text-sm font-medium truncate">{user?.name || user?.username}</div>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/admin/login") })}
            className="mt-3 inline-flex items-center gap-2 text-xs text-charcoal/60 hover:text-charcoal"
          >
            <LogOut size={14} /> Uitloggen
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-white border-b border-charcoal/10 px-4 py-3 flex items-center justify-between">
          <div className="font-display text-lg">Boterbloem Admin</div>
          <button onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/admin/login") })}>
            <LogOut size={18} />
          </button>
        </header>
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full">{children}</main>
      </div>
    </div>
  );
}
