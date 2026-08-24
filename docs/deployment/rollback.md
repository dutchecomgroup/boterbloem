# Rollback

Wat te doen als een deploy misgaat.

---

## 🔴 Eerst dit: er draait geen automatische backup

Op dit moment maakt **niets** automatisch een backup van de database of van `uploads/`. Er is
dus geen recent herstelpunt tenzij je er zelf net een hebt gemaakt.

Inrichten staat in
[../komende-plannen/3-onaangeraakt/infra-domein-livegang.md](../komende-plannen/3-onaangeraakt/infra-domein-livegang.md)
fase B, en zou vóór livegang klaar moeten zijn. Zolang dat niet zo is: **altijd handmatig een
dump nemen** vóór elke deploy.

`uploads/` is extra gevoelig — dat zijn de foto's van de klant, ze staan nergens anders, en
ze zijn niet opnieuw te maken.

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
