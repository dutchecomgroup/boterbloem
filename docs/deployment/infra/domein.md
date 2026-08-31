# Domein en reverse proxy

> **Status op 2026-08-25:** nog niets ingericht. De applicatie hangt kaal op poort 6778
> zonder domein en zonder HTTPS.
>
> Dit bestand is de **plek waar de uiteindelijke opzet komt te staan**. Het plan om er te
> komen staat in
> [../../komende-plannen/3-onaangeraakt/infra-domein-livegang.md](../../komende-plannen/3-onaangeraakt/infra-domein-livegang.md).
> Zodra het draait: vul dit bestand in en verwijs vanuit het plan hierheen.

---

## Huidige stand

| | Waarde |
|---|---|
| Server | Strato VPS `85.215.182.227` (Plesk, Apache, PM2) |
| Applicatie | poort 6778, PM2-proces `atelierboterbloem` |
| Domein | `atelierboterbloem` staat bij **mijndomein**, nog niet gekoppeld |
| HTTPS | geen certificaat |
| Mail | **buiten scope** — loopt via Gmail op haar telefoon, staat los van deze server |

Op dezelfde machine draaien `tcgdeckmaster` en `beautystudiodynamic`. Bij het inrichten van
de vhost: controleer dat je geen bestaande configuratie overschrijft.

---

## ⚠️ Alleen A en CNAME aanraken

De mail van de klant loopt via Gmail en heeft **niets** met deze server te maken. Bij het
aanpassen van de DNS:

- **wel**: het A-record en `www`
- **niet**: MX, TXT, SPF, of wat er verder aan mailrecords staat

Een MX-record dat je "voor de netheid" meeneemt legt haar mail plat, en dat merk je pas als
iemand belt dat er niets meer binnenkomt. Laat staan wat er staat.

---

## In te vullen zodra het draait

### DNS

| Type | Naam | Waarde | Ingesteld op |
|---|---|---|---|
| A | `@` | `85.215.182.227` | _(datum)_ |
| CNAME | `www` | `@` | |
| _(mailrecords)_ | — | **niet aangeraakt** | — |

### Reverse proxy

Vhost in Plesk: `<domein>` → `localhost:6778`, met doorgifte van `X-Forwarded-For` en
`X-Forwarded-Proto`. [`server/index.ts`](../../../server/index.ts) staat al op
`trust proxy: 1`, dus dat sluit aan.

Let op de maximale aanvraaggrootte: foto-uploads gaan tot 10 MB per bestand en tot 30
bestanden tegelijk. De standaardwaarde van Apache is vaak lager, en dan faalt een upload met
een fout die niets over grootte zegt.

_(In te vullen: het vhost-bestand of de Plesk-instelling zoals die uiteindelijk staat.)_

### Certificaat

Let's Encrypt via Plesk, met automatische verlenging en een omleiding van HTTP naar HTTPS.

Pas ná het certificaat `NODE_ENV=production` zetten: de sessiecookie staat op
`secure: isProd` en werkt niet over gewoon HTTP.

_(In te vullen: uitgiftedatum en of automatische verlenging bevestigd is.)_

### `.env` op de server

| Variabele | Waarde |
|---|---|
| `NODE_ENV` | `production` |
| `PUBLIC_BASE_URL` | `https://<domein>` — staat nu nog op `http://localhost:6778` |
| `DATABASE_URL` | host `localhost` (op de server, niet de publieke IP) |

### Poorten dichtzetten

Zodra de proxy draait: 6778 alleen nog op localhost, en 5432 óók. Zie
[../../komende-plannen/2-in-uitvoering/security-hardening.md](../../archive/planning/security-hardening.md).

---

## Verificatie na inrichting

Zie [../testscript-master.md](../testscript-master.md) §8 — die sectie is precies hiervoor.

---

## Terugdraaien zodra HTTPS er is (gezet op 31-08)

Twee dingen staan er alleen omdat de preview op een kaal IP draait. Ze horen weg op het moment
dat de reverse proxy en het certificaat er zijn, en als ze blijven staan is dat een gat:

| Wat | Waar | Waarom hij er staat |
|---|---|---|
| `ufw allow 6778/tcp` | UFW op de VPS | zonder proxy is dit de enige weg naar de site. Met 443 is het een tweede deur die niets toevoegt |
| `COOKIE_SECURE=false` | `.env` op de VPS | `NODE_ENV=production` is wat de gebouwde site serveert, maar zet ook `secure` op de sessiecookie — en die bewaart een browser niet over gewoon `http`. Zonder deze sleutel kan zij niet inloggen met een kloppend wachtwoord |
| `Disallow: /` | `client/public/robots.txt` | de content is nog niet af; wat een zoekmachine nu ophaalt blijft daarna in de resultaten staan |

De UFW-regel draagt zijn eigen reden als comment, dus `ufw status` vertelt het je.
