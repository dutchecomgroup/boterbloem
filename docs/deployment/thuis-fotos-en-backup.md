# De foto's veiligstellen en de backup inrichten

> **Gemaakt:** 29 augustus 2026 · **Uitgevoerd:** 31 augustus 2026
> **Status:** ✅ **Stap 1 t/m 4 gedaan.** Dit document blijft staan als verantwoording en als
> handleiding voor de volgende keer dat er materiaal binnenkomt.
>
> Wat er nu geldt, in het kort:

| | Toen (29-08) | Nu (31-08) |
|---|---|---|
| Originelen | 1 machine | **3 plekken**: pc thuis, Google Drive, server |
| Foto's op de server | 0 bestanden | **23 webp + 50 bronbestanden** |
| Backup | geen | **elke nacht 03:20**, beide databases + `uploads/`, 30 dagen |
| DB vanaf huis | geblokkeerd | via SSH-tunnel op **15432** |

> De acht migraties en de deploy waren toen nog een apart traject; die zijn op 31-08 ook gedaan,
> in dezelfde sessie. Zie [history.md](history.md).

---

## Waar de originelen nu staan

**Google Drive** (`dutchecomgroup@gmail.com`), in de vaste projectstructuur:

```
Mijn Drive / Dutch eCom Group / 13 Boterbloem / 04 Assets & Foto's /
    01 Origineel aangeleverd / 2026-08-27 aanlevering Esmee /   25 bestanden
    02 Hernoemd en bruikbaar / fotos (20) · merk (3) · teksten (2)
    LEESMIJ.md
```

De splitsing is de kern: **01 is onvervangbaar** — haar eigen bestandsnamen, inclusief de HEIC's
uit haar telefoon — en **02 is daaruit afgeleid**, hernoemd naar wat erop staat en met HEIC
omgezet naar JPG. 20 + 3 + 2 = precies de 25 uit 01, dus er is niets afgevallen. Elke volgende
aanlevering krijgt een eigen map onder 01 met de datum erin.

> ⚠️ **Niet OneDrive.** Daar stond eerst een kopie, maar OneDrive draaide niet op die pc — dan
> is het een tweede map op dezelfde schijf en geen tweede plek. Die kopie is verwijderd.

---

## De situatie zoals hij was op 29-08

> Historisch. Dit is waarom het gedaan moest worden; hierboven staat wat het geworden is.

Haar foto's staan op **precies één machine**: de pc thuis. Niet op de server (die map is leeg),
niet op de laptop, en niet in git (`uploads/` is gitignored, en dat hoort ook zo). De database
op dev kent 23 foto's en verwijst naar bestanden die nergens anders bestaan. Gaat die pc stuk,
dan is het beeldmateriaal van de klant weg — inclusief de originele HEIC's uit haar telefoon.

Dat is de reden dat stap 1 hieronder vóór alle andere staat.

### Wat er gecontroleerd was op 29-08

| | |
|---|---|
| Server `uploads/` | **leeg** — 0 bestanden |
| Laptop `uploads/gallery/` | 36 bestanden, allemaal **oude democontent** |
| Dev-database | 23 `gallery_items`, bestanden ontbreken op laptop én server |
| Live-database | 10 tabellen, 0 foto's, geen `packages`/`reviews`/`order_payments` |
| Servercode | branch `main`, laatste commit **29 mei** |
| Backup-cron | **bestaat niet** |

De server draait dus nog de oude site. Al het werk van 24 t/m 27 augustus staat op `development`
en op dev — nergens anders.

---

## Stap 1 — Originelen veiligstellen ✅ gedaan 31-08

Twee minuten, en het haalt het risico weg dat de rest van dit document overbodig maakt.

Op de pc thuis, in de projectmap: kopieer **`uploads/content/`** naar een externe schijf of een
cloudmap die je vertrouwt (OneDrive, Google Drive, een NAS — wat je al gebruikt).

```powershell
# Voorbeeld: naar OneDrive. Pas het doelpad aan naar wat jij gebruikt.
Copy-Item -Recurse -Force `
  "C:\...\boterbloem\uploads\content" `
  "$env:USERPROFILE\OneDrive\Boterbloem-fotos-origineel-2026-08-29"
```

**Waarom deze map en niet `uploads/gallery/`:** in `content/` staan haar aanlevering en de
originele HEIC's. De webp's in `gallery/` zijn daaruit gegenereerd door
`scripts/import-klantfotos.ts` en kunnen opnieuw gemaakt worden. `content/` kan dat niet — dat
is het onvervangbare deel.

> **Niet in git.** Git verwijdert nooit iets: elke versie van elke foto blijft voor altijd in de
> historie, en iedereen die cloont sleept alles mee. Zodra zij zelf foto's gaat uploaden via het
> beheerpaneel schrijft de server bovendien nieuwe bestanden die *niet* in git staan — dan heb je
> twee bronnen die uit elkaar lopen. Foto's zijn een backup-probleem, niet een versiebeheer-probleem.

---

## Stap 2 — Foto's naar de server ✅ gedaan 31-08

De server is waar de site ze vandaan serveert ([`server/index.ts:45`](../../server/index.ts#L45):
`express.static(UPLOADS_DIR)`), dus daar moeten ze staan.

```powershell
cd "C:\...\boterbloem"

scp -i C:\Users\User\Documents\Projecten\keys\tcgdeckmaster_vps -r `
  uploads\gallery\* `
  root@85.215.182.227:/projects/atelierboterbloem/uploads/gallery/
```

Controleer daarna dat ze er zijn (verwacht: hetzelfde aantal als je verstuurde):

```powershell
ssh -i C:\Users\User\Documents\Projecten\keys\tcgdeckmaster_vps root@85.215.182.227 `
  "find /projects/atelierboterbloem/uploads -type f | wc -l"
```

**Lukt `scp` niet vanaf die pc?** Dan is er een tweede weg: die pc heeft de foto's én toegang tot
de database, dus `npx tsx scripts/import-klantfotos.ts` opnieuw draaien werkt ook. Dat script is
idempotent op `altText` en maakt dus geen dubbele rijen.

> ⚠️ Sinds 28-08 staat **poort 5432 dicht** in de firewall (UFW `default deny`). Werkt de
> database vanaf die pc niet meer, dan is dat de oorzaak — zie stap 4.

### Eén ding om te weten bij deze stap

De 23 foto's horen bij de **dev**-database; de app op de server draait op **live**, die nul foto's
kent. Je zet de bestanden dus in een map waar de draaiende site ze (nog) niet opvraagt.

Dat is geen fout en het breekt niets — bestanden zonder rij zijn onzichtbaar, en de site verandert
er niet van. Het is bewust vooruitwerken: bij de deploy krijgt live dezelfde rijen via de acht
migraties, en dan staan de bestanden er al. Alternatief zou zijn om ze pas tijdens de deploy te
kopiëren, en dan doe je twee risicovolle dingen tegelijk.

**Wat je dus niet moet verwachten:** dat de foto's na deze stap op de publieke site verschijnen.
Dat gebeurt pas na de migraties en de deploy.

---

## Stap 3 — De backup-cron ✅ gedaan 31-08

Er draait **niets** automatisch. De commando's staan in [procedure.md](procedure.md), maar er is
geen cron. Zolang dat zo is, staat haar materiaal op één plek zodra stap 1 verwatert.

Wat weg moet kunnen: **beide databases én `uploads/`**. De database alleen is niet genoeg — dan
heb je straks 23 rijen die naar bestanden verwijzen die niemand meer heeft.

> 🔴 **Backup pakt `_dev` óók, en dat is hier geen bijvangst maar de kern.** Live blijft live —
> daar wordt niet aan gewerkt, en dat hoort zo. Maar dat betekent dat op dit moment *dev* de
> database met de waarde is: **15 tabellen en 23 foto's**, tegen live met 10 tabellen en 0 foto's.
> Al het werk van 24 t/m 27 augustus staat daar. Een backup die alleen live dumpt, bewaart precies
> de lege oude versie en laat het echte werk onbeschermd. Zodra de acht migraties gedraaid zijn en
> live weer de hoofdrol heeft, blijft dit script gewoon kloppen — het pakt ze allebei.

Op de server:

```bash
ssh -i C:\Users\User\Documents\Projecten\keys\tcgdeckmaster_vps root@85.215.182.227

mkdir -p ~/backups/boterbloem
cat > /usr/local/bin/backup-boterbloem.sh <<'SH'
#!/bin/bash
set -euo pipefail
DIR=~/backups/boterbloem
STAMP=$(date +%F)
# Allebei: live is de productiedatabase, _dev draagt op dit moment het werk van deze week.
for DB in atelierboterbloem atelierboterbloem_dev; do
  sudo -u postgres pg_dump "$DB" | gzip > "$DIR/$DB-$STAMP.sql.gz"
done
tar czf "$DIR/uploads-$STAMP.tar.gz" -C /projects/atelierboterbloem uploads
# Ouder dan 30 dagen opruimen, anders loopt de schijf een keer vol
find "$DIR" -name '*.gz' -mtime +30 -delete
SH
chmod +x /usr/local/bin/backup-boterbloem.sh

# Eerst één keer met de hand draaien — een cron die faalt merk je anders pas als je hem nodig hebt
/usr/local/bin/backup-boterbloem.sh && ls -lh ~/backups/boterbloem/

# Elke nacht om 03:20
(crontab -l 2>/dev/null; echo "20 3 * * * /usr/local/bin/backup-boterbloem.sh") | crontab -
```

> Schijfruimte is geen bezwaar: 303 GB vrij van 348 GB (gemeten 29-08).

**Een backup die je nooit teruggezet hebt is een aanname.** Pak een keer een `db-….sql.gz` en laad
hem in `atelierboterbloem_dev` — dat is meteen de verversing die na elke deploy toch moet.

---

## Stap 4 — Verbinden met de database vanaf huis ✅ in gebruik

Poort 5432 is dicht sinds de hardening van 28-08. Dat is de gewenste situatie: een databasepoort
hoort niet open op het internet. Op de laptop draait het nu via een **SSH-tunnel**, en thuis werkt
dezelfde aanpak.

```powershell
# Tunnel openen (laat dit venster open staan)
ssh -i C:\Users\User\Documents\Projecten\keys\tcgdeckmaster_vps -N `
  -L 15432:localhost:5432 root@85.215.182.227
```

En in `.env` op die pc:

```
DATABASE_URL=postgresql://abb_app:<wachtwoord>@localhost:15432/atelierboterbloem_dev
```

`localhost` zorgt ervoor dat [`server/db.ts`](../../server/db.ts#L15-L22) TLS overslaat, en dat
klopt hier: de SSH-tunnel versleutelt de verbinding al.

> Poort **15432** en niet 5433 — die laatste bleek op de laptop bezet.
> Tailscale zou ook kunnen (de UFW-regel staat er al), maar dat werkt niet fijn, dus tunnel.

---

## Wat je hierna hebt

| | Voor | Na |
|---|---|---|
| Originelen | 1 machine | 2 plekken + backup |
| Foto's op de server | 0 | alle |
| Backup | geen | elke nacht, DB + uploads, 30 dagen |
| DB vanaf huis | geblokkeerd | via tunnel |

**Wat hierna nog openstaat:**

1. ✅ ~~De acht migraties naar live + de deploy~~ — gedaan op 31-08, zie [history.md](history.md).
2. ⏳ **Sterk wachtwoord** voor het live `admin`-account.
3. ⏳ De **klikronde** (stap 13) en de nieuwe schermen op 375 / 768 / 1440.
4. ⏳ **Een backup één keer terugzetten.** Er draait er nu elke nacht een, maar hij is nooit
   getest. Zolang dat zo is, is het een aanname.
5. ⏳ **HTTPS.** De backups staan bovendien allemaal op dezelfde schijf als het origineel; dat
   beschermt tegen een foute migratie, niet tegen het uitvallen van de machine.
