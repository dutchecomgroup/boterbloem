# Rollback

Wat te doen als een deploy misgaat.

---

## Eerst dit: waar je herstelpunt staat

Sinds **31-08** draait er elke nacht om **03:20** een backup:
`/usr/local/bin/backup-boterbloem.sh`, via cron van root.

| | |
|---|---|
| Wat | `atelierboterbloem` + `atelierboterbloem_dev` (gzipte `pg_dump`) en `uploads/` (tar.gz) |
| Waar | `~/backups/boterbloem/` op de VPS |
| Hoe lang | 30 dagen; ouder wordt opgeruimd door het script zelf |

```bash
ls -lh ~/backups/boterbloem/
```

Daarnaast staat er `atelierboterbloem-voor-livegang.sql.gz` — de live-database zoals hij vóór
de livegang van 31-08 was, met de mei-testdata erin. Die valt buiten de 30-dagenregel niet;
**wil je hem houden, verplaats hem dan naar buiten die map.**

> ⚠️ **Alles op dezelfde schijf.** De backups staan op de VPS zelf. Dat beschermt tegen een
> verkeerde migratie of een foute deploy, niet tegen het uitvallen van de machine. Voor de
> foto's is dat opgevangen — die staan ook op de pc thuis en in Google Drive — voor de database
> niet.

> ⚠️ **Nog nooit teruggezet.** Een backup die je niet één keer hebt teruggezet is een aanname.
> Doe die oefening bij de eerstvolgende keer dat de dev-database toch ververst moet worden:
> dan test je het herstel én krijg je waar je toch al voor kwam.

`uploads/` is het gevoeligst: dat zijn de foto's van de klant. Ze staan sinds 31-08 op drie
plekken (pc thuis, Google Drive, server), maar wat zij vanaf nu zelf uploadt bestaat alleen op
de server — en dus in deze backup.

---

## Code terugdraaien

Snelst, en meestal genoeg:

```bash
ssh root@85.215.182.227
cd /projects/atelierboterbloem

git log --oneline -10        # zoek de laatste goede commit
git checkout <commit>        # of: git reset --hard <commit>

npm ci
npm run build
pm2 reload atelierboterbloem
pm2 logs atelierboterbloem --lines 50
```

Daarna weer op een branch komen (`git checkout main`) zodra de fix er is — een losgekoppelde
HEAD is makkelijk te vergeten.

---

## Database terugdraaien

Zwaarder, en alleen als een schemawijziging of een script data heeft beschadigd.

```bash
# 1. Applicatie stil — geen schrijfacties tijdens het terugzetten
pm2 stop atelierboterbloem

# 2. Zekerheidsdump van de huidige, kapotte staat.
#    Klinkt onnodig. Is het niet: hij bevat data van ná je laatste backup.
pg_dump -U abb_app atelierboterbloem | gzip > ~/backups/abb-VOOR-HERSTEL-$(date +%F-%H%M).sql.gz

# 3. Terugzetten
gunzip -c ~/backups/abb-<datum>.sql.gz | psql -U abb_app atelierboterbloem

# 4. Weer aan
pm2 start atelierboterbloem
pm2 logs atelierboterbloem --lines 50
```

Zet je de database terug, dan moet de **code mee terug** naar de versie die bij dat schema
hoorde. Nieuwe code op een oud schema geeft fouten die lastiger te lezen zijn dan het
oorspronkelijke probleem.

---

## Uploads terugzetten

```bash
tar xzf ~/backups/abb-uploads-<datum>.tar.gz -C /
```

Controleer het pad in het archief voordat je uitpakt — de commando's in
[procedure.md](procedure.md) maken een archief met een absoluut pad.

---

## Als het schema stuk is maar de data goed

Soms is er alleen een kolom te veel of te weinig. Terugzetten is dan te zwaar.

1. `shared/schema.ts` terug naar de vorige staat
2. Een corrigerende `.sql` schrijven en draaien — **niet** `db:push`, dat lost hier niets op

> ⚠️ Let op: een kolom die door de eerste push is **toegevoegd** wordt door deze tweede push
> **weer verwijderd**, inclusief wat erin stond. Staat er al data in die je wil houden, zet
> die dan eerst apart.

---

## Deploy afbreken vóór de schade

Merk je halverwege dat het misgaat:

```bash
pm2 stop atelierboterbloem
```

Dan staat de site uit, maar er wordt niets meer stuk gemaakt. Dat is bijna altijd beter dan
doorgaan.

---

## Na afloop

Elke terugdraai-actie krijgt een regel in [history.md](history.md): wat er misging, wat je
gedaan hebt, en wat het had voorkomen. Dat laatste is het punt van de aantekening.
