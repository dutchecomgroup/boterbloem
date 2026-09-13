/**
 * Een webadres-veilige naam, afgeleid uit een titel.
 *
 * **Waarom hier en niet in de client.** Deze functie stond twee keer letterlijk hetzelfde in de
 * codebase (`PackagesPage` en `GalleryAdminPage`), en nergens op de server. Het taartscherm had
 * hem helemaal niet: daar moest de klant de slug zelf intikken. Haar reactie: *"slug -- dit is
 * onnodig voor de client, te technisch, dit moet standaard in de backend al gebeuren."*
 *
 * In `shared/` omdat beide kanten hem nodig hebben: de server om te genereren, de client om
 * vooraf te laten zien welk webadres een nieuwe gelegenheid krijgt. Twee implementaties van een
 * normalisator lopen vroeg of laat uit elkaar, en dan wijst de voorvertoning naar een ander adres
 * dan het echte.
 *
 * Voorbeeld: `"Bruidstaart op maat"` → `bruidstaart-op-maat`, `"Crème brûlée"` → `creme-brulee`.
 */
export function slugify(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Het eerste vrije webadres, gegeven wat er al bestaat.
 *
 * Twee keer "Bruidstaart" is normaal; zonder deze stap liep de tweede op de unieke index en
 * kwam er een 500 met een databasefout in beeld. Nu wordt het `bruidstaart-2`, zoals een mens het
 * zou nummeren.
 *
 * Een lege uitkomst -- een naam met alleen leestekens of emoji -- valt terug op `item`, zodat er
 * nooit een lege slug de database in gaat.
 */
export function vrijNummer(bezet: ReadonlySet<string>, basis: string): string {
  const start = basis || "item";
  if (!bezet.has(start)) return start;
  for (let n = 2; n < 1000; n++) {
    const kandidaat = `${start}-${n}`;
    if (!bezet.has(kandidaat)) return kandidaat;
  }
  return `${start}-${Date.now()}`;
}
