# Testscript

> Het **enige** testscript. Nieuw werk wordt hier bijgewerkt, niet ernaast gezet als een
> tweede bestand — anders moet je vóór een deploy vijf documenten openen en zelf uitzoeken
> welke stappen elkaar hebben ingehaald.

Er zijn geen geautomatiseerde tests in dit project. Dit is de handmatige ronde. Duurt
volledig ongeveer 20 minuten.

**Vooraf:** `npm run typecheck` en `npm run build` moeten groen zijn. De server compileert
niet apart, dus `typecheck` is het enige vangnet dat je hebt.

---

## §1 — Publieke site

| # | Stap | Verwacht |
|---|---|---|
| 1.1 | `/` openen | Hero laadt, carrousel wisselt na ~4,5 s |
| 1.2 | Doorscrollen | Onthul-animaties vuren, niets springt |
| 1.3 | Verminderde beweging aanzetten in het OS, herladen | Geen animaties, pagina blijft leesbaar |
| 1.4 | `/galerij` | Foto's laden, categoriefilter werkt |
| 1.5 | Foto aanklikken | Lightbox opent, sluit met klik ernaast en met ✕ |
| 1.6 | `/galerij/<categorie>` rechtstreeks openen | Voorgefilterd, juiste categorie actief |
| 1.7 | `/aanbod` | Aanbod laadt |
| 1.8 | `/over` | Tekst uit de instellingen |
| 1.9 | `/contact` | Formulier + contactgegevens |
| 1.10 | Onbestaande URL | Nette 404-pagina |
| 1.11 | Alles op mobiel formaat (375 px) | Menu opent, geen horizontaal schuiven |
| 1.12 | Voettekst | Contactgegevens uit de instellingen, Instagram-link klopt |

---

## §2 — Contactformulier

| # | Stap | Verwacht |
|---|---|---|
| 2.1 | Leeg verzenden | Foutmeldingen per veld, geen verzending |
| 2.2 | Ongeldig e-mailadres | "Geldig e-mailadres vereist" |
| 2.3 | Bericht van 3 tekens | "Schrijf een kort bericht" |
| 2.4 | Correct invullen | Bevestiging, formulier leeg |
| 2.5 | Beheerpaneel → Aanvragen | De aanvraag staat erin, status `nieuw` |
| 2.6 | Aantal personen leeglaten | Verzendt zonder fout |

---

## §3 — Inloggen

| # | Stap | Verwacht |
|---|---|---|
| 3.1 | `/admin` zonder sessie | Doorsturen naar `/admin/login` |
| 3.2 | Fout wachtwoord | "Onjuiste inloggegevens", geen sessie |
| 3.3 | Correct inloggen | Naar het dashboard |
| 3.4 | Herladen | Nog steeds ingelogd |
| 3.5 | Uitloggen | Terug naar inloggen; `/admin` weigert weer |
| 3.6 | Hoofdletters in de gebruikersnaam | Werkt — wordt naar kleine letters omgezet |

> ⚠️ Lukt inloggen lokaal niet: staat `NODE_ENV` op `production` in je `.env`? Dan is de
> sessiecookie `secure` en wordt hij niet over `http://localhost` verstuurd. Zie
> [../workflow/lokale-dev-omgeving.md](../workflow/lokale-dev-omgeving.md).

---

## §4 — Dashboard

| # | Stap | Verwacht |
|---|---|---|
| 4.1 | Dashboard openen | Vier tegels tonen getallen, geen `—` waar data is |
| 4.2 | Omzetgrafiek | Twaalf maanden op de horizontale as, ook bij nul omzet |
| 4.3 | Netwerktabblad | `GET /api/admin/stats/dashboard` geeft **200** |
| 4.4 | Tegels aanklikken | Naar aanvragen respectievelijk boekingen |

> 🐛 4.3 vangt de fout van 24-08: een `Date` in een ruwe `sql`-template liet dit endpoint met
> een 500 klappen. Zie [pending.md](pending.md).

---

## §5 — Boekingen en klanten

| # | Stap | Verwacht |
|---|---|---|
| 5.1 | Boeking aanmaken | Verschijnt in de lijst |
| 5.2 | Status wijzigen | Blijft na herladen |
| 5.3 | Bedrag met decimalen (`123,45`) | Correct opgeslagen en getoond |
| 5.4 | Boeking verwijderen | Weg, regels ook weg |
| 5.5 | Klant aanmaken | Verschijnt in de lijst |
| 5.6 | Klant met alleen een naam | Toegestaan — alleen naam is verplicht |
| 5.7 | Aanvraag → boeking omzetten | Klant + boeking aangemaakt, aanvraag op `omgezet_naar_order` |

---

## §6 — Galerij

| # | Stap | Verwacht |
|---|---|---|
| 6.1 | Eén foto uploaden | Verschijnt, is WebP |
| 6.2 | Vijf tegelijk | Alle vijf erin |
| 6.3 | Telefoonfoto (met EXIF-draaiing) | Staat rechtop, niet gekanteld |
| 6.4 | Bestand > 10 MB | Nette foutmelding, geen crash |
| 6.5 | PDF proberen | Geweigerd — alleen afbeeldingen |
| 6.6 | Categorie toewijzen | Blijft na herladen |
| 6.7 | Uitgelicht aanzetten | Ster zichtbaar, foto bovenaan in de galerij |
| 6.8 | Foto verwijderen | Weg uit de lijst **en** het bestand van schijf |
| 6.9 | Publieke galerij | Wijziging is zichtbaar |

---

## §7 — Instellingen

| # | Stap | Verwacht |
|---|---|---|
| 7.1 | Contactgegevens opslaan | Bevestiging, blijft na herladen |
| 7.2 | Publieke site | Nieuwe gegevens in voettekst en op contactpagina |
| 7.3 | Hero-tekst wijzigen | Zichtbaar op de homepage |
| 7.4 | Over-tekst wijzigen | Zichtbaar op `/over` |

---

## §8 — Vóór de livegang

Deze sectie geldt alleen bij de eerste echte livegang.

| # | Stap | Verwacht |
|---|---|---|
| 8.1 | `https://<domein>` | Laadt met geldig certificaat |
| 8.2 | `http://` | Leidt om naar `https://` |
| 8.3 | Inloggen achter de proxy | Werkt — `secure`-cookie komt aan |
| 8.4 | Foto uploaden achter de proxy | Werkt — let op de maximale aanvraaggrootte in Apache |
| 8.5 | Poort 6778 en 5432 van buitenaf | **Dicht** |
| 8.6 | Mail van de klant | Werkt nog ná de DNS-wijziging — we raken de MX-records niet aan, maar dit is het moment waarop het misgaat als er tóch iets is aangepast |
| 8.6b | `mailto:`-link op de contactpagina | Opent de mail-app met het juiste adres, op desktop **en** op een telefoon |
| 8.7 | Link delen in WhatsApp | Nette voorbeeldweergave met afbeelding |
| 8.8 | 🚫 Stockfoto's en verzonnen quotes | **Weg — dit is een harde poort.** Geen `images.unsplash.com` in de gebouwde bundel, geen verzonnen testimonials. Andermans taarten tonen als haar werk misleidt bezoekers die daarop een offerte aanvragen. Geen echte foto's = geen livegang |
| 8.9 | `pg_dump`-cron | Draait, en is één keer teruggezet in een testdatabase |

---

## Bij een fout

1. Noteer stap-nummer, wat je verwachtte en wat er gebeurde
2. PM2-logs erbij: `pm2 logs atelierboterbloem --lines 100`
3. Klein en duidelijk? Fixen en de sectie opnieuw draaien
4. Groter? Entry in [../komende-plannen/README.md](../komende-plannen/README.md) en beslissen
   of de deploy doorgaat
