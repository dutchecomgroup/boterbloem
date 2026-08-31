# Afgeronde plannen

Plannen die **live draaien**. Ze komen hierheen vanuit
[`../../komende-plannen/`](../../komende-plannen/) zodra de code op de server staat — niet zodra
hij gebouwd is. Die regel staat in [`../../komende-plannen/README.md`](../../komende-plannen/README.md)
en is er om te voorkomen dat "af" en "draait" door elkaar gaan lopen.

Ze blijven staan als verantwoording: waaróm iets zo gebouwd is, welke keuzes er onderweg zijn
gemaakt en wat er bewust buiten scope viel. Dat is precies wat je een half jaar later niet meer
uit de code kunt aflezen.

---

## Gearchiveerd op 31-08-2026 — de eerste livegang

Alle zeven gingen mee met de deploy van 31 augustus. Zie
[`../../deployment/history.md`](../../deployment/history.md) voor wat er die dag precies gebeurd is.

| Plan | Wat het opleverde |
|---|---|
| 🖼️ [portfolio-categorie-albums](portfolio-categorie-albums.md) | Gelegenheid → event → foto's, plus het categorie-beheer dat er niet was |
| 🍰 [pakketten-en-prijzen](pakketten-en-prijzen.md) | `packages` met vanaf-prijs en "wat zit erin"; `/aanbod` herschreven |
| 📅 [agenda-boekingen](agenda-boekingen.md) | Maandagenda met boekingen én aanvragen, plus een ICS-feed met eigen token |
| ⭐ [content-reviews](content-reviews.md) | Reviews, concept standaard, blok verdwijnt bij nul |
| 📨 [aanvragen-formulier-uitbreiding](aanvragen-formulier-uitbreiding.md) | Gelegenheid, pakket en een levertijd-waarschuwing in het formulier |
| 👥 [klanten-uitbreiding](klanten-uitbreiding.md) | Ontdubbeling op e-mailadres, detailscherm, zoekveld |
| 🔒 [security-hardening](security-hardening.md) | Vijf bevindingen uit de code-review; de laatste (poort 5432) op 28-08 |

> ⚠️ **Afgerond betekent niet af voor de bezoeker.** Bij `pakketten-en-prijzen` en
> `content-reviews` staat het gereedschap er, maar moet de klant het nog vullen: er zijn nog
> geen prijzen en nog geen reviews. Wat er van haar nodig is staat in
> [`../../klant/content-invulplan.md`](../../klant/content-invulplan.md) §7.

---

## Wat hier (nog) niet staat

Werk dat wél live draait maar nooit een eigen plan-document had — de omzetpagina, de
betalingen, de btw per regel, de huisstijlwissel en het ontwerp. Dat is per dag vastgelegd in
[`../../komende-plannen/werkblok-huidig.md`](../../komende-plannen/werkblok-huidig.md), en dat
werkblok wordt bij het afsluiten van de ronde als `werkblok-v0.1.md` hierheen verplaatst.
