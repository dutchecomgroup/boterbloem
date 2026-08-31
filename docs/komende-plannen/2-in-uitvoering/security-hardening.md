# Security hardening — vijf bevindingen uit de code-review

> **Status:** ✅ **Af.** Code 25-08, firewall 28-08 (UFW `default deny`, 5432 dicht). Op 31-08
> geverifieerd van buitenaf: 5432 en 6778 waren allebei dicht — 6778 is daarna bewust weer
> opengezet voor de preview, met een comment in de regel die zegt wanneer hij weer dicht mag.
> **Thema:** 🔒 security
> **Laatst bijgewerkt:** 2026-08-25
> **Afhankelijk van:** SSH-toegang tot de VPS (alleen voor het firewall-deel)
> **Effort-schatting:** ~0,5 dag — waarvan ~4 uur gedaan

## Stand van zaken

| # | Bevinding | Status |
|---|---|---|
| 1 | Database publiek open + `ssl: "prefer"` | ✅ TLS afgedwongen in code (25-08) + poort 5432 dicht (28-08) |
| 2 | Geen begrenzing op inloggen | ✅ gedaan |
| 3 | Instellingen worden niet gevalideerd | ✅ gedaan |
| 4 | Bestandsnaam aanpasbaar → padmanipulatie | ✅ gedaan |
| 5 | Contactformulier zonder rem | ✅ gedaan |

Geverifieerd met 17 controles tegen de draaiende server, allemaal geslaagd. Details in
[../../deployment/pending.md](../../deployment/pending.md).

**Gedaan op 28-08.** UFW staat op `default deny (incoming)` met alleen 22, 80, 443, 8443, 8880
en de mailpoorten open. Lokaal ontwikkelen gaat sindsdien via een SSH-tunnel — zie
[../../workflow/lokale-dev-omgeving.md](../../workflow/lokale-dev-omgeving.md).

> ⚠️ **Bijvangst die niemand opmerkte:** 6778 ging mee dicht, en daarmee de site zelf. Dat viel
> pas op bij de livegang van 31-08, want er keek nog niemand naar. De app draaide al die tijd
> gewoon door. Als je een poort dichtzet, controleer dan ook wat je *wél* wilde bereiken.

> 🔴 **Nog open, en het hoort bij dit plan:** de preview draait op `http://` zonder certificaat,
> met `COOKIE_SECURE=false` in `.env` omdat een `secure`-cookie anders niet bewaard wordt. Haar
> wachtwoord gaat daarmee leesbaar over de lijn. Weg zodra er HTTPS is — zie
> [../3-onaangeraakt/infra-domein-livegang.md](../3-onaangeraakt/infra-domein-livegang.md).

## Context

Bij de code-doorloop van 24-08 kwamen vijf punten naar boven. Geen van alle is op dit moment
uitgebuit — de site staat nog niet publiek onder een domein — maar bevinding 1 lekt nu al
gegevens, en de andere vier moeten dicht zijn vóór livegang.

Dit is het eerste werk dat opgepakt kan worden: het hangt nergens van af en vraagt niets van
de klant.

## De vijf bevindingen

### 1. 🔴 Database staat publiek open, verbinding is niet versleuteld

`db.ts` verbindt met:

```ts
const client = postgres(env.DATABASE_URL, { ssl: isProd ? false : "prefer", … })
```

en `.env.example` wijst voor lokale ontwikkeling naar `85.215.182.227:5432` — de publieke
IP van de VPS.

`"prefer"` betekent: probeer versleuteld, en **val stil terug op onversleuteld** als de server
het niet aanbiedt. Er is geen foutmelding als dat gebeurt. Concreet gaan het
database-wachtwoord en alle klantgegevens onversleuteld over het open internet, elke keer dat
er lokaal ontwikkeld wordt. Dat de poort überhaupt publiek open staat, betekent bovendien dat
iedereen wachtwoorden kan proberen.

**Aanpak, bij voorkeur allebei:**

- **Poort dichtzetten.** 5432 in de firewall beperken tot localhost. Lokaal ontwikkelen gaat
  dan via een SSH-tunnel — `ssh -L 5432:localhost:5432 root@85.215.182.227` — en `.env` wijst
  naar `localhost:5432`. Die aanpak staat al als optie beschreven in
  [../../deployment/procedure.md](../../deployment/procedure.md) voor poort 6778.
- **SSL afdwingen.** `ssl: "require"` voor niet-lokale verbindingen, zodat een terugval op
  onversleuteld een *fout* wordt in plaats van stilte.

> ⚠️ Zolang dit open staat, geldt: **nooit** database-inloggegevens in een chat, transcript of
> issue plakken. Bij dutchthrifthub is dat een keer gebeurd en daar staat sindsdien een
> openstaande sleutelrotatie. Gebeurt het hier: wachtwoord meteen roteren.

### 2. 🟠 Geen snelheidsbegrenzing op de inlogpagina

`POST /api/admin/auth/login` in [`auth.ts`](../../../server/routes/admin/auth.ts) accepteert
onbeperkt pogingen. Er is één beheerdersaccount, dus dat is één wachtwoord om te raden, zonder
rem en zonder spoor in de logs.

**Aanpak:** `express-rate-limit` op de auth-router — bijvoorbeeld 10 pogingen per kwartier per
IP. Mislukte pogingen loggen met IP en gebruikersnaam, zodat er iets terug te kijken valt.

De rest van de opzet is goed: bcrypt met 12 rondes, sessies in Postgres, `httpOnly` +
`secure` in productie + `sameSite: lax`, en `requireAuth` correct gemount op alles onder
`/api/admin/*` behalve `/auth/*`.

### 3. 🟠 Instellingen worden niet gevalideerd

`PUT /api/admin/settings/:key` in [`settings.ts`](../../../server/routes/admin/settings.ts)
gebruikt:

```ts
const upsertSchema = z.object({ key: z.string().min(1).max(80), value: z.unknown() })
```

`z.unknown()` accepteert werkelijk alles, onder elke sleutelnaam. Terwijl
`contactSettingsSchema`, `heroSettingsSchema` en `aboutSettingsSchema` gewoon in
[`shared/schema.ts:265-292`](../../../shared/schema.ts) staan — geschreven, en nergens
aangeroepen. Dode code op de plek waar de validatie hoort.

Gevolg: een typefout in een sleutelnaam maakt stilzwijgend een nieuwe rij, en een verkeerd
gevormde waarde slaat op zonder klacht en breekt de site pas bij het renderen.

**Aanpak:** een sleutel-naar-schema-kaart, onbekende sleutels afwijzen met een 400. Uit te
breiden met de `levertijden`-sleutel uit [agenda-boekingen.md](../1-klaar-voor-livegang/agenda-boekingen.md).

### 4. 🟡 Bestandsnaam is aanpasbaar → padmanipulatie bij verwijderen

`PATCH /api/admin/gallery/:id` in [`gallery.ts:124-134`](../../../server/routes/admin/gallery.ts)
accepteert het volledige invoegschema partieel, dus ook `filename` en `source`. En bij
verwijderen gebeurt dit:

```ts
await fs.unlink(path.join(GALLERY_DIR, row.filename)).catch(() => {})
```

Een `filename` met `../` erin laat die `unlink` buiten de galerijmap uitkomen. Alleen
uitvoerbaar door iemand die al is ingelogd, dus de ernst is beperkt — maar het botst met de
eigen regel in [`CLAUDE.md`](../../../CLAUDE.md): *"Galerij-bestandsnamen zijn UUID-gebaseerd;
nooit user-input gebruiken in filenames."* Bij het uploaden wordt die regel keurig gevolgd;
bij het wijzigen valt hij per ongeluk weg.

**Aanpak:** `.omit({ filename: true, source: true })` op het patch-schema. Als extra rem vóór
de `unlink` controleren dat het opgeloste pad binnen `GALLERY_DIR` valt. `albumId` moet er wél
in blijven — zie [portfolio-categorie-albums.md](../1-klaar-voor-livegang/portfolio-categorie-albums.md).

### 5. 🟡 Contactformulier zonder rem

`POST /api/public/contact` staat open zonder honeypot, zonder snelheidsbegrenzing en zonder
captcha. Zodra de site vindbaar is, vult formulierspam de aanvragenlijst — precies de lijst
waarop ze moet kunnen vertrouwen.

**Aanpak:** honeypot-veld (verborgen invoerveld dat een mens nooit invult; ingevuld → stil een
201 teruggeven en niets opslaan), plus een snelheidsbegrenzing per IP. Captcha bewust niet: dat
kost echte bezoekers moeite, en honeypot plus begrenzing vangt het overgrote deel.

## Aanpak in volgorde

| # | Werk | Tijd | Waarom deze volgorde |
|---|---|---|---|
| 1 | Poort 5432 + SSL | 1,5 uur | Lekt nu al gegevens |
| 2 | Begrenzing op inloggen | ½ uur | Vóór het domein live gaat |
| 5 | Honeypot + begrenzing contact | 1 uur | Vóór de site vindbaar is |
| 3 | Instellingen-validatie | 1 uur | Bestaande schema's aansluiten |
| 4 | Bestandsnaam-schema | ½ uur | Doen bij het album-werk |

## Bestanden

| Bestand | Wijziging |
|---|---|
| `server/db.ts` | `ssl: "require"` voor niet-lokale verbindingen |
| `.env.example` | tunnel-instructie + `localhost` als aanbevolen waarde |
| `docs/deployment/procedure.md` | firewall-stap + tunnel-uitleg |
| `server/routes/admin/auth.ts` | begrenzing + logregel bij mislukte poging |
| `server/routes/admin/settings.ts` | sleutel-naar-schema-kaart |
| `shared/schema.ts` | de drie bestaande schema's exporteren als kaart |
| `server/routes/admin/gallery.ts` | `filename`/`source` uit het patch-schema, padcontrole |
| `server/routes/public.ts` | honeypot + begrenzing |
| `client/src/pages/public/ContactPage.tsx` | verborgen honeypot-veld |
| `package.json` | `express-rate-limit` |

## Verificatie

- [ ] Verbinding zonder SSL naar de database wordt **geweigerd**, niet stilzwijgend geaccepteerd
- [ ] `nc -zv 85.215.182.227 5432` van buitenaf → dicht
- [ ] Lokaal ontwikkelen via de tunnel werkt: `npm run dev` verbindt en de site laadt
- [ ] 11e inlogpoging binnen een kwartier → 429
- [ ] Mislukte inlog verschijnt in het log met IP en tijdstip
- [ ] Geldige inlog werkt nog gewoon (geen regressie op de sessie)
- [ ] `PUT /api/admin/settings/onzin` → 400
- [ ] `PUT /api/admin/settings/contact` met een ongeldig e-mailadres → 400
- [ ] Bestaande instellingen blijven opslaan zoals ze deden
- [ ] `PATCH /gallery/:id` met `filename: "../../etc/passwd"` → 400, veld genegeerd
- [ ] Galerijfoto verwijderen werkt nog gewoon en ruimt het bestand op
- [ ] Ingevuld honeypot-veld → 201 naar buiten, **geen** rij in de database
- [ ] Normale aanvraag komt gewoon door
- [ ] 20 aanvragen in een minuut vanaf één IP → begrensd

## Effort-schatting

**~0,5 dag** in totaal (4,5 uur werk). Punt 1 is het zwaarst en het belangrijkst; punt 4 kan
meeliften op het album-werk in fase 2.
