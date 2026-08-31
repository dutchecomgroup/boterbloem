# Platform-overzicht

Wat er is, en waar het staat. Stand van **2026-08-24** — vóór de bouw van de wensen uit de
meeting.

---

## Eén proces, twee gezichten

Express draait op poort **6778** en doet drie dingen tegelijk:

1. **`/api/public/*`** — open endpoints, geen inlog
2. **`/api/admin/*`** — achter een sessiecookie (`abb.sid`)
3. **In productie: de gebouwde client** — `dist/client`, met een catch-all die alles wat geen
   `/api` of `/uploads` is naar `index.html` stuurt

In ontwikkeling neemt de Vite dev-server op 5173 dat derde punt over en proxyt `/api` en
`/uploads` naar 6778.

Statische uploads worden geserveerd vanaf `/uploads`, met een cache van 30 dagen in
productie.

---

## Publieke pagina's

| Route | Bestand | Wat |
|---|---|---|
| `/` | `pages/public/HomePage.tsx` | Hero met carrousel, uitgelicht werk, procesverhaal, testimonials, Instagram-raster |
| `/galerij` | `pages/public/GalleryPage.tsx` | Sticky stapel: één volle kaart per gelegenheid |
| `/galerij/:slug` | idem | De events binnen één gelegenheid |
| `/galerij/:slug/:albumSlug` | idem | Eén event, met zijn verhaal en foto's |
| `/aanbod` | `pages/public/AanbodPage.tsx` | Pakketten per familie, taart-menukaart, smaken |
| `/werkwijze` | `pages/public/WerkwijzePage.tsx` | Haar procesverhaal in zeven stappen |
| `/over` | `pages/public/AboutPage.tsx` | Tekst uit `site_settings.about` |
| `/contact` | `pages/public/ContactPage.tsx` | Aanvraagformulier + contactgegevens |

Alles binnen `PublicLayout` (sticky navigatie, voettekst met contactgegevens uit de
instellingen) en een `PageTransition`.

> ✅ **Opgelost op 27-08.** Hier stond dat `SERVICES`, `TESTIMONIALS` en `lib/demoGallery.ts`
> eruit moesten. Dat is gebeurd: de pakketten en reviews komen uit de database, en de
> demo-laag is verwijderd. De publieke pagina's draaien volledig op haar eigen content.
>
> 🔴 **Eén uitzondering, tijdelijk:** drie Unsplash-foto's bij de grazing-pakketten, omdat er
> bij haar twintig foto's geen enkele grazing table zit. Ze dragen `source: "demo"`, staan
> onder een niet-gepubliceerde gelegenheid, en `npm run check:demo -- --strict` faalt er
> bewust op. Weghalen: `npx tsx scripts/seed-demo-grazefotos.ts --verwijder`.

---

## Beheerpagina's

Alles achter `ProtectedAdmin` in [`App.tsx`](../../client/src/App.tsx), dat `/auth/me`
bevraagt en bij een 401 doorstuurt naar de inlogpagina.

| Route | Bestand | Wat |
|---|---|---|
| `/admin/login` | `LoginPage.tsx` | Gebruikersnaam + wachtwoord |
| `/admin` | `DashboardPage.tsx` | Vier tegels + 12-maands omzetgrafiek (Recharts) |
| `/admin/boekingen` | `OrdersPage.tsx` | Boekingen met status en klant |
| `/admin/aanvragen` | `ContactRequestsPage.tsx` | Binnengekomen aanvragen, status, omzetten naar boeking |
| `/admin/klanten` | `CustomersPage.tsx` | Klantenlijst |
| `/admin/producten` | `ProductsPage.tsx` | Producten + prijzen (nog niet publiek zichtbaar) |
| `/admin/galerij` | `GalleryAdminPage.tsx` | Uploaden, categorieën, volgorde |
| `/admin/instellingen` | `SettingsPage.tsx` | Contactgegevens, hero, over-tekst |

---

## API-routes

### Publiek — `server/routes/public.ts`

| Methode | Pad | Wat |
|---|---|---|
| GET | `/api/public/settings` | Alle site-instellingen als één object |
| GET | `/api/public/gallery` | Alle foto's + categorieën |
| GET | `/api/public/gallery/:slug` | Eén categorie met zijn foto's |
| POST | `/api/public/contact` | Aanvraag opslaan (Zod-gevalideerd) |

### Beheer — `server/routes/admin/`

Gemount in `admin/index.ts`. **`/auth` staat vóór `requireAuth`**, al het overige erachter.

| Bestand | Routes |
|---|---|
| `auth.ts` | `POST /login`, `POST /logout`, `GET /me` |
| `orders.ts` | CRUD + `POST /from-contact` (aanvraag → klant + boeking) |
| `customers.ts` | CRUD + `GET /:id` met boekingenhistorie |
| `products.ts` | CRUD |
| `gallery.ts` | Items-CRUD, categorieën-CRUD, multipart-upload, `POST /reorder` |
| `contact-requests.ts` | Lijst, `PATCH /:id/status`, verwijderen |
| `settings.ts` | `GET /`, `PUT /:key` (JSONB-upsert) |
| `stats.ts` | `GET /dashboard` — totalen + 12-maands omzet |

Plus `GET /api/health` buiten beide routers om.

---

## Auth

- bcrypt met 12 rondes ([`server/auth.ts`](../../server/auth.ts))
- Sessies in Postgres via connect-pg-simple, tabel `sessions`
- Cookie `abb.sid` — `httpOnly`, `secure` in productie, `sameSite: lax`, 14 dagen, verlengend
- `requireAuth` gemount op router-niveau, niet per route — één plek, geen vergeten endpoint

Gebruikersnamen worden bij inloggen naar kleine letters omgezet en zo ook opgeslagen door
`seed-admin`.

---

## Upload-pijplijn

`POST /api/admin/gallery` (multipart, veld `files[]`, maximaal 30 bestanden):

```
Multer (in geheugen, max 10 MB, alleen afbeeldingen)
  → Sharp: .rotate() → resize 1600×1600 "inside" → WebP kwaliteit 82
  → wegschrijven als <uuid>.webp in uploads/gallery/
  → rij in gallery_items met de gemeten breedte/hoogte
```

Bestandsnamen zijn UUID-gebaseerd; er komt geen gebruikersinvoer in een pad. `.rotate()`
zonder argument past de EXIF-oriëntatie toe — anders staan telefoonfoto's gekanteld.

---

## Wat er niet is

Voor de volledigheid, want dit is wat de meeting van 24-08 vraagt:

- geen pakketten, geen publieke prijzen
- geen agenda of kalender
- geen reviews in de database
- geen album-laag onder de galerij-categorieën
- geen tests, geen CI
- geen geautomatiseerde migratie-tracking — wel versiebeheerde `.sql`-bestanden sinds 25-08

Zie [../komende-plannen/README.md](../komende-plannen/README.md).

## 📭 Mail — bewust afwezig

Er is **geen mailfunctionaliteit**, en die komt er ook niet (besloten 25-08). Niets in dit
systeem verstuurt of ontvangt ooit een bericht.

Het enige wat over mail bestaat is de `mailto:`-link in
[`PublicLayout.tsx`](../../client/src/components/layout/PublicLayout.tsx) en op de
contactpagina, die de mail-app van de bezoeker opent met het adres uit
`site_settings.contact.email`. Dat is een gewone link, geen verzendlaag.

**Gevolg dat je moet kennen:** een nieuwe contactaanvraag geeft **geen signaal naar buiten**.
Hij komt alleen terecht in het beheerpaneel onder *Aanvragen*, met een teller op het
dashboard. Zie
[../komende-plannen/1-klaar-voor-livegang/aanvragen-formulier-uitbreiding.md](../archive/planning/aanvragen-formulier-uitbreiding.md).
