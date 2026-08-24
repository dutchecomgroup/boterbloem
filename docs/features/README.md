# Features

Implementatie-documentatie van gebouwde features: hoe iets werkt, waarom het zo gebouwd is,
en welke randgevallen er tijdens de bouw naar boven kwamen.

**Nog leeg** — er is nog niets uit de roadmap gebouwd.

---

## Wanneer komt hier iets te staan?

Niet elke feature verdient een document. Schrijf er een als een van deze dingen geldt:

- er zitten **randgevallen** in die je over drie maanden niet meer weet
- er is een **keuze** gemaakt waarvan de reden niet uit de code blijkt
- het raakt **meerdere lagen** (schema + routes + frontend) en het overzicht helpt
- iemand anders moet eraan kunnen werken zonder het eerst helemaal uit te pluizen

Een CRUD-scherm dat precies doet wat je verwacht heeft geen document nodig. De agenda met zijn
ICS-feed en token-authenticatie wél.

## Verwachte documenten

Op basis van de roadmap in [../komende-plannen/werkblok-huidig.md](../komende-plannen/werkblok-huidig.md):

| Feature | Waarom een doc | Uit |
|---|---|---|
| `portfolio.md` | Drie lagen (categorie → album → foto) en een datamigratie | fase 2 |
| `agenda.md` | ICS-formaat, token-auth buiten de sessie om, hele-dag versus tijdgebonden events | fase 5 |

## Werkwijze

Een feature is af → plan-document naar [../archive/planning/](../archive/planning/) met status
`afgerond`, en als het bovenstaande geldt: een document hier met **hoe het werkt**, niet met
hoe het gebouwd is. Het plan beschrijft het pad ernaartoe; dit beschrijft de bestemming.
