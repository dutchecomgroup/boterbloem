import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "wouter";
import { LayoutDashboard, Inbox, CalendarCheck, Euro } from "lucide-react";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";

/**
 * Eén tegel van het dashboard. De streep links draagt de betekenis; de rest blijft rustig,
 * zodat het getal het luidste op de tegel blijft.
 */
function Tegel({
  label, children, href, rand, accent, icoon,
}: {
  label: string;
  children: ReactNode;
  href?: string;
  /** Tailwind-klasse voor de kleur van de streep links, uit de kleurtaal. */
  rand: string;
  /** Optionele wassing — alleen als de tegel écht om actie vraagt. */
  accent?: string;
  icoon?: ReactNode;
}) {
  const inhoud = (
    <>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-charcoal/55">
        {icoon}
        {label}
      </div>
      <div className="mt-3 font-display text-4xl leading-none">{children}</div>
    </>
  );
  const klassen = `card border-l-4 ${rand} ${accent ?? ""}`;

  return href ? (
    <Link href={href} className={`${klassen} block transition hover:shadow-md`}>{inhoud}</Link>
  ) : (
    <div className={klassen}>{inhoud}</div>
  );
}

interface DashboardStats {
  openRequests: number;
  upcomingOrders: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
}

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["admin", "stats", "dashboard"],
    queryFn: () => api.get<DashboardStats>("/api/admin/stats/dashboard"),
  });

  const delta = data ? data.revenueThisMonth - data.revenueLastMonth : 0;
  const deltaPct = data && data.revenueLastMonth > 0
    ? Math.round((delta / data.revenueLastMonth) * 100)
    : null;

  return (
    <div>
      <PageKop
        titel="Dashboard"
        icoon={LayoutDashboard}
        onderschrift="Overzicht van Atelier Boterbloem"
      />

      {/*
        De vier tegels hadden alle vier hetzelfde gewicht — vier witte vlakken naast elkaar. Nu
        volgen ze de kleurtaal: aanvragen vragen aandacht (boterbloem), komende boekingen zijn merk
        (salie), omzet is geld dat binnen is (groen), en vorige maand is geschiedenis (rustig).
      */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Tegel
          href="/admin/aanvragen"
          label="Nieuwe aanvragen"
          rand="border-l-boterbloem"
          // Alleen kleuren als er écht iets ligt: een nul die om aandacht vraagt is ruis.
          accent={data?.openRequests ? "bg-boterbloem/35" : undefined}
          icoon={<Inbox size={15} className="text-sage-dark" />}
        >
          {data?.openRequests ?? "—"}
        </Tegel>

        <Tegel
          href="/admin/boekingen"
          label="Komende 30 dagen"
          rand="border-l-sage"
          icoon={<CalendarCheck size={15} className="text-sage-dark" />}
        >
          {data?.upcomingOrders ?? "—"}
        </Tegel>

        <Tegel label="Omzet deze maand" rand="border-l-emerald-600">
          <span className="text-emerald-700">
            {data ? formatCurrency(data.revenueThisMonth) : "—"}
          </span>
          {deltaPct !== null && (
            <div className={`mt-1 text-xs font-body ${delta >= 0 ? "text-emerald-700" : "text-burgundy"}`}>
              {delta >= 0 ? "+" : ""}{deltaPct}% vs vorige maand
            </div>
          )}
        </Tegel>

        <Tegel label="Omzet vorige maand" rand="border-l-charcoal/20">
          <span className="text-charcoal/55">
            {data ? formatCurrency(data.revenueLastMonth) : "—"}
          </span>
        </Tegel>
      </div>

      <div className="card-accent">
        <div className="mb-6 flex items-center justify-between border-b border-sage/20 pb-3">
          <div>
            <h2 className="text-xl">Omzet 12 maanden</h2>
            <p className="text-xs text-charcoal/50">Afgeleverde boekingen, geteld op de datum van het feest</p>
          </div>
          <Link href="/admin/omzet" className="text-xs text-sage-dark hover:underline">
            Alle cijfers →
          </Link>
        </div>
        <div className="h-72">
          {data?.revenueByMonth?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueByMonth} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0001" />
                <XAxis dataKey="month" stroke="#2B2926" fontSize={12} />
                <YAxis stroke="#2B2926" fontSize={12} tickFormatter={(v) => `€${v}`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ background: "#FBF6EE", border: "1px solid #C8A560" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#C8A560" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <LegeStaat
              icoon={Euro}
              titel="Nog geen omzet"
              hint="Zodra een boeking op afgeleverd staat, verschijnt hij hier in de maand van het feest."
            />
          )}
        </div>
      </div>
    </div>
  );
}
