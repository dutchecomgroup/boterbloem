/**
 * Een PATCH met een leeg object kwam tot nu toe bij Drizzle terecht, dat er een
 * `No values to set` uit gooide — een 500 op wat gewoon een invoerfout is.
 *
 * Komt vaker voor dan je denkt: een schema dat velden `omit`, strip ze stilzwijgend, dus
 * een verzoek dat alléén zo'n veld bevat blijft leeg over.
 */
export function requireFields<T extends object>(data: T): T {
  if (Object.keys(data).length === 0) {
    const err = new Error("Geen velden om bij te werken") as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  return data;
}
