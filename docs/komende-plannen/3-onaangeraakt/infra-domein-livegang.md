# Domein en livegang

> **Status:** 🟡 Wacht op DNS-toegang
> **Thema:** ⚙️ infra
> **Laatst bijgewerkt:** 2026-08-25
> **Afhankelijk van:** DNS-toegang van de klant
> **Effort-schatting:** ~1 dag werk + DNS-wachttijd

## Context

Uit de meeting van 24-08:

> *"atelierboterbloem — mijndomein, kan overgezet worden van het domein naar de hosting
> server."*

De applicatie draait op de Strato-VPS `85.215.182.227` op poort **6778**, naast
`tcgdeckmaster` en `beautystudiodynamic`. Er is nog geen domein aan gekoppeld en geen
HTTPS-certificaat. [`procedure.md`](../../deployment/procedure.md) noemt zelf al dat poort
6778 mogelijk niet extern bereikbaar is en dat een reverse proxy via Plesk de bedoeling is —
dat is nooit afgemaakt.

Daarnaast zijn er twee dingen die bij livegang horen en die nu ontbreken: **backups** en het
feit dat de gebouwde bestandenbundel **931 kB in één stuk** is.

## Scope

**Wel:** DNS, reverse proxy, HTTPS, backups, opsplitsen van de bundel, en de laatste
livegang-punten.

**Niet:**
- **Mail — in geen enkele vorm** (besloten 25-08, zie hieronder)
- Een aparte staging-omgeving, een CDN, monitoring met waarschuwingen

## 📭 Mail valt buiten scope

> **Besloten 25-08.** Er wordt **niets** met mail gebouwd. Geen mailmodule in het
> beheerpaneel, geen synchronisatie, en ook **geen automatische notificatie** bij een nieuwe
> aanvraag. Haar mail loopt volledig via Gmail op haar telefoon, buiten dit systeem om.
>
> Het enige wat er in de applicatie over mail bestaat, is de **`mailto:`-link** op de
> contactpagina en in de voettekst — die opent de mail-app van de bezoeker. Dat werkt al en
> vraagt geen werk.
>
> **Praktisch gevolg:** nieuwe aanvragen komen alleen binnen in het beheerpaneel onder
> *Aanvragen*. Er is geen signaal naar buiten. Dat is een bewuste keuze; de afspraak is dat
> ze daar zelf kijkt.
>
> **Voor DNS betekent dit:** ⚠️ **de MX- en TXT-records blijven met rust.** Ze hebben niets
> met deze server te maken. Een MX-record dat je "voor de netheid" meeneemt bij het aanpassen
> van het A-record is de klassieke manier om per ongeluk de mail van een bedrijf plat te
> leggen — en dat merk je pas als iemand belt dat er niets meer binnenkomt.

## Aanpak

### Fase A — DNS en reverse proxy (~3 uur + wachttijd)

1. **Domein bepalen.** `atelierboterbloem.nl` staat bij mijndomein. De registratie blijft
   daar; we passen alleen de DNS-records aan. Een verhuizing van de registratie zelf levert
   hier niets op en brengt wel risico mee.
2. **A-record** `atelierboterbloem.nl` → `85.215.182.227`, plus `www` als CNAME.
   ⚠️ **Alleen deze twee records aanraken.** Zie de waarschuwing hierboven.
3. **Reverse proxy** in Plesk/Apache: `atelierboterbloem.nl` → `localhost:6778`. Doorgeven van
   `X-Forwarded-For` en `X-Forwarded-Proto`; [`server/index.ts`](../../../server/index.ts)
   staat al op `trust proxy: 1`, dus dat sluit aan.
   Let op de **maximale aanvraaggrootte**: foto-uploads gaan tot 10 MB per bestand en tot 30
   bestanden tegelijk. De standaardwaarde van Apache is vaak lager, en dan faalt een upload
   met een foutmelding die niets over grootte zegt.
4. **HTTPS** met Let's Encrypt via Plesk, met automatische verlenging en een omleiding van
   HTTP naar HTTPS.
5. **`PUBLIC_BASE_URL`** in `.env` naar het echte domein — die staat nu nog op
   `http://localhost:6778`.
6. **Poort 6778 dichtzetten** voor extern verkeer zodra de proxy draait; alles loopt dan via
   443. Doe dit samen met het dichtzetten van 5432 uit
   [security-hardening.md](../2-in-uitvoering/security-hardening.md).

De sessiecookie staat op `secure: isProd`, dus die werkt pas achter HTTPS. Dat bepaalt de
volgorde: eerst het certificaat, dan pas `NODE_ENV=production`.

### Fase B — Backups (~2 uur)

Er is nu **geen** automatische backup. [`procedure.md`](../../deployment/procedure.md) noemt
de `pg_dump`- en `tar`-commando's, maar niets draait ze uit zichzelf.

- Dagelijkse `pg_dump` via cron, 30 dagen bewaren
- Wekelijkse mirror van `uploads/` — dat zijn haar foto's, en die staan nergens anders
- Beide naar een pad buiten de applicatiemap, en bij voorkeur naar een andere machine of
  opslagdienst; een backup op dezelfde schijf als het origineel is geen backup
- Terugzetten **één keer daadwerkelijk uitproberen**. Een backup die nooit teruggezet is, is
  een aanname.

Procedure vastleggen in [../../deployment/rollback.md](../../deployment/rollback.md).

### Fase C — Bundel opsplitsen (~1 uur)

`vite build` levert nu:

```
dist/client/assets/index-*.js   931,15 kB │ gzip: 271,10 kB
```

Eén bestand met de publieke site **en** het volledige beheerpaneel inclusief Recharts.
Iedereen die de homepage bezoekt laadt het beheerpaneel mee.

`React.lazy` op de beheerroutes in [`App.tsx`](../../../client/src/App.tsx) — de zeven
`/admin/*`-routes zitten daar al netjes bij elkaar, dus dit is een kleine ingreep — met een
`Suspense`-terugval. Verwachting: de publieke bundel ongeveer halveren.

### Fase D — De laatste livegang-punten (~2 uur)

- 🚫 **Stockfoto's eruit — dit is de harde poort.** Grotendeels gedaan op 27-08: de demo-laag
  `demoGallery.ts` is verwijderd, de 36 stockfoto's en 6 verzonnen reviews zijn uit de
  database, en de site draait op haar eigen twintig foto's. **Wat er nog staat:** drie
  Unsplash-foto's bij de grazing-pakketten, omdat er bij haar aanlevering geen enkele grazing
  table zit. Weg met `npx tsx scripts/seed-demo-grazefotos.ts --verwijder` zodra ze eigen
  foto's heeft. `npm run check:demo -- --strict` controleert nu zowel de gebouwde bundel als
  de database en faalt hierop.
- ✅ **Verzonnen quotes eruit** — gedaan op 27-08; het reviewblok is leeg tot ze er aanlevert
- **Contactgegevens ingevuld** in het beheerscherm — het e-mailadres dat daar staat is wat de
  `mailto:`-link opent, dus dat moet kloppen
- **Vindbaarheid**: paginatitels en omschrijvingen per pagina, Open Graph-afbeelding voor
  wanneer iemand de link deelt, `robots.txt`, `sitemap.xml`
- **Favicon** uit haar logo. Er staat sinds 27-08 een zelfgetekende boterbloem in
  `client/public/favicon.svg`; die verwijzing gaf daarvóór een 404. Vervangen zodra haar
  vectorlogo er is — de aangeleverde bestanden zijn bitmaps met linnen ondergrond en op 32×32
  onleesbaar. Zie [content-invulplan.md](../../klant/content-invulplan.md).
- **Instagram-link** controleren in de instellingen (staat nu op een standaardwaarde uit de seed)
- **Testronde** volgens [../../deployment/testscript-master.md](../../deployment/testscript-master.md)

## Bestanden

| Bestand | Wijziging |
|---|---|
| `.env` (op de VPS) | `PUBLIC_BASE_URL`, `NODE_ENV=production` |
| `client/src/App.tsx` | `React.lazy` op de beheerroutes |
| `client/index.html` | titel, omschrijving, Open Graph, favicon |
| `client/public/robots.txt` + `sitemap.xml` | nieuw |
| `docs/deployment/infra/domein.md` | de uiteindelijke DNS-opzet vastleggen |
| `docs/deployment/rollback.md` | backup- en terugzetprocedure |

Geen wijzigingen aan `server/` — er komt geen verzendlaag.

## Verificatie

- [ ] `https://atelierboterbloem.nl` laadt de site met een geldig certificaat
- [ ] `http://` leidt om naar `https://`
- [ ] `www` werkt en komt op dezelfde site uit
- [ ] Inloggen op het beheerpaneel werkt achter de proxy (sessiecookie met `secure` komt aan)
- [ ] Foto-upload werkt achter de proxy — test met een bestand van ~8 MB
- [ ] Poort 6778 en 5432 zijn van buitenaf **dicht**
- [ ] ⚠️ **Haar mail werkt nog** — testbericht heen en weer ná de DNS-wijziging. We raken de
      MX-records niet aan, maar dit is het moment waarop het misgaat als er tóch iets is
      aangepast
- [ ] `mailto:`-link op de contactpagina opent de mail-app met het juiste adres, op desktop
      **en** op een telefoon
- [ ] `pg_dump`-cron draait, bestand verschijnt, en is **één keer teruggezet** in een testdatabase
- [ ] `uploads/`-mirror bevat de foto's
- [ ] Publieke bundel is meetbaar kleiner na het opsplitsen; beheerpaneel laadt nog gewoon
- [ ] Link delen in WhatsApp toont een nette voorbeeldweergave met afbeelding
- [ ] Geen stockfoto's en geen verzonnen quotes meer op de live site

## Effort-schatting

| Onderdeel | Inschatting |
|---|---|
| DNS + proxy + HTTPS | 3 uur (+ DNS-wachttijd) |
| Backups + terugzetten testen | 2 uur |
| Bundel opsplitsen | 1 uur |
| Livegang-punten | 2 uur |
| **Totaal** | **~1 dag** verspreid over twee momenten |

Fase A staat stil tot er DNS-toegang is. B en C kunnen direct.
