import { describe, it, expect } from "vitest";
import { requireFields } from "./patch.js";

describe("requireFields", () => {
  it("laat een gevuld object ongewijzigd door", () => {
    const data = { featured: true };
    expect(requireFields(data)).toBe(data);
  });

  it("gooit een 400 bij een leeg object", () => {
    // Voorheen kwam dit bij Drizzle terecht, dat er "No values to set" uit gooide — een
    // 500 op wat gewoon een invoerfout is.
    try {
      requireFields({});
      expect.unreachable("had moeten gooien");
    } catch (err) {
      expect((err as Error & { status?: number }).status).toBe(400);
      expect((err as Error).message).toMatch(/geen velden/i);
    }
  });
});
