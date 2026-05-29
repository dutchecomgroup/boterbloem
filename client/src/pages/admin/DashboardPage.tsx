import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Link } from "wouter";

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
      <h1 className="text-3xl mb-2">Dashboard</h1>
      <p className="text-charcoal/60 text-sm mb-8">Overzicht van Atelier Boterbloem</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link href="/admin/aanvragen" className="card hover:shadow-md transition">
          <div className="text-xs uppercase tracking-widest text-charcoal/50">Nieuwe aanvragen</div>
          <div className="mt-3 text-4xl font-display">{data?.openRequests ?? "—"}</div>
        </Link>
        <Link href="/admin/boekingen" className="card hover:shadow-md transition">
          <div className="text-xs uppercase tracking-widest text-charcoal/50">Komende 30 dagen</div>
          <div className="mt-3 text-4xl font-display">{data?.upcomingOrders ?? "—"}</div>
        </Link>
        <div className="card">
          <div className="text-xs uppercase tracking-widest text-charcoal/50">Omzet deze maand</div>
          <div className="mt-3 text-4xl font-display">{data ? formatCurrency(data.revenueThisMonth) : "—"}</div>
          {deltaPct !== null && (
            <div className={`text-xs mt-1 ${delta >= 0 ? "text-emerald-600" : "text-burgundy"}`}>
              {delta >= 0 ? "+" : ""}{deltaPct}% vs vorige maand
            </div>
          )}
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-widest text-charcoal/50">Omzet vorige maand</div>
          <div className="mt-3 text-4xl font-display">{data ? formatCurrency(data.revenueLastMonth) : "—"}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl">Omzet 12 maanden</h2>
            <p className="text-xs text-charcoal/50">Op basis van afgeleverde + betaalde boekingen</p>
          </div>
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
            <div className="h-full flex items-center justify-center text-charcoal/40 text-sm">Geen data</div>
          )}
        </div>
      </div>
    </div>
  );
}
