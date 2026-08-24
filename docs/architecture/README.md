# Architectuur

Hoe het systeem in elkaar zit op systeemniveau. Zoek je hoe een specifieke feature werkt, kijk
dan in [../features/](../features/); wat er nog gebouwd moet worden staat in
[../komende-plannen/](../komende-plannen/).

## Wat zoek je?

| Onderwerp | Bestand |
|---|---|
| **Globaal overzicht** — pagina's, routes, auth, uploads | [platform-overview.md](platform-overview.md) |
| **Datamodel** — tabellen, enums, conventies | [datamodel.md](datamodel.md) |
| **Tech stack** — pakketten, versies, opvallende keuzes | [tech-stack.md](tech-stack.md) |
| **Design system** — kleuren, typografie, componentklassen | [design-system.md](design-system.md) |

## Beginnen

Nieuw op dit project? Lees in deze volgorde:

1. [../README.md](../README.md) — wat is het en hoe start je het
2. [platform-overview.md](platform-overview.md) — wat zit erin
3. [datamodel.md](datamodel.md) — hoe de gegevens gestructureerd zijn
4. [../komende-plannen/werkblok-huidig.md](../komende-plannen/werkblok-huidig.md) — waar we mee bezig zijn

## De drie dingen die je moet weten

**Schema-first.** [`shared/schema.ts`](../../shared/schema.ts) is de single source of truth.
Nieuw veld? Eerst daar, dan een `.sql` in `docs/deployment/sql-pending/`, dan de route, dan de frontend.

**Eén live database.** Er is geen dev-kopie. Wat je lokaal aanpast, pas je aan op productie.

**De server compileert niet.** Hij draait via `tsx`, ook op de VPS. `npm run typecheck` is je
enige vangnet — er is geen compileerstap die een fout tegenhoudt vóór de deploy.

## Verwante documentatie

- **Deployen** → [../deployment/](../deployment/)
- **Dagelijkse workflow** → [../workflow/](../workflow/)
- **Wat de klant wil** → [../klant/](../klant/)
