import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, User, CalendarX } from "lucide-react";
import { api } from "../../lib/api";
import type { Customer, Order } from "@shared/schema";
import { formatDateShort } from "../../lib/utils";
import { STATUS_LABEL, STATUS_KLEUR } from "../../lib/boeking";
import { PageKop } from "../../components/admin/ui/PageKop";
import { LegeStaat } from "../../components/admin/ui/LegeStaat";
import { Badge } from "../../components/admin/ui/Badge";
import { Bedrag } from "../../components/admin/ui/Bedrag";

type KlantMetHistorie = Customer & { orders: Order[] };

/**
 * De server leverde de boekingenhistorie al mee via `GET /api/admin/customers/:id`, maar er
 * was geen scherm dat die route aanriep. Dit is dat scherm.
 */
/**
 * Waar een boeking opent. `/admin/boekingen` leest `?boeking=` uit en schuift de sheet open —
 * zie `useSheetParam`. Vanuit de klanthistorie kom je zo direct in de boeking zelf uit, in
 * plaats van in de lijst waar je 'm dan nog moet opzoeken.
 */
const boekingHref = (orderId: number) => `/admin/boekingen?boeking=${orderId}`;

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigeer] = useLocation();

  const { data: klant, isLoading, isError } = useQuery({
    queryKey: ["admin", "customers", id],
    queryFn: () => api.get<KlantMetHistorie>(`/api/admin/customers/${id}`),
    retry: false,
  });

  if (isLoading) return <div className="text-charcoal/40 py-20 text-center">Laden…</div>;
  if (isError || !klant) {
    return (
      <div className="py-20 text-center">
        <p className="text-charcoal/60 mb-4">Klant niet gevonden.</p>
        <Link href="/admin/klanten" className="text-sage underline">Terug naar klanten</Link>
      </div>
    );
  }

  const omzet = klant.orders
    .filter((o) => o.status === "afgeleverd")
    .reduce((n, o) => n + Number(o.totalPrice), 0);

  return (
    <div>
      <Link href="/admin/klanten"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-charcoal/50 hover:text-charcoal mb-4">
        <ArrowLeft size={14} /> Klanten
      </Link>

      <PageKop titel={klant.name} bovenschrift="Klant" icoon={User} />

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="card space-y-3 text-sm">
          {klant.email && (
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-sage shrink-0" />
              <a href={`mailto:${klant.email}`} className="hover:text-sage-dark break-all">{klant.email}</a>
            </div>
          )}
          {klant.phone && (
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-sage shrink-0" />
              <a href={`tel:${klant.phone}`} className="hover:text-sage-dark">{klant.phone}</a>
            </div>
          )}
          {klant.address && (
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-sage shrink-0 mt-0.5" />
              <span className="whitespace-pre-wrap">{klant.address}</span>
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-charcoal/10 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-charcoal/45">Boekingen</div>
              <div className="font-display text-2xl">{klant.orders.length}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-charcoal/45">Omzet</div>
              <div className="font-display text-2xl text-emerald-700">
                <Bedrag waarde={omzet} rol="voldaan" />
              </div>
              <div className="text-[10px] text-charcoal/40">alleen afgeleverd</div>
            </div>
          </div>

          {klant.notes && (
            <div className="pt-3 mt-3 border-t border-charcoal/10">
              <div className="text-xs uppercase tracking-widest text-charcoal/45 mb-1">Notities</div>
              <p className="whitespace-pre-wrap text-charcoal/75 leading-relaxed text-xs">{klant.notes}</p>
            </div>
          )}

          <div className="pt-3 mt-3 border-t border-charcoal/10 text-xs text-charcoal/40">
            Klant sinds {formatDateShort(klant.createdAt)}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="tag border-b border-sage/25 bg-linen/50 px-4 py-3">Boekingen</div>
          {klant.orders.length ? (
            <table className="tabel-admin w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2.5">Boeking</th>
                  <th className="text-left px-4 py-2.5">Datum</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-right px-4 py-2.5">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {/*
                  De rij hád al een hover-kleur maar geen link, dus hij zag eruit als klikbaar
                  en was het niet. Nu allebei: een klik op de rij voor het gemak, én een echte
                  link op het boekingsnummer zodat het met het toetsenbord en met een
                  schermlezer ook werkt — en zodat "openen in nieuw tabblad" doet wat je
                  verwacht.
                */}
                {klant.orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigeer(boekingHref(o.id))}
                    className="rij-hover cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={boekingHref(o.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-sage-dark hover:underline"
                      >
                        {o.reference ?? `#${o.id}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{o.eventDate ? formatDateShort(o.eventDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <Badge klassen={STATUS_KLEUR[o.status]}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right"><Bedrag waarde={o.totalPrice} vet /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4">
              <LegeStaat
                icoon={CalendarX}
                titel="Nog geen boekingen"
                hint="Zodra deze klant een feest bij je boekt, staat het hier."
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
