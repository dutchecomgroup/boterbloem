-- Herstel van testdata die op 2026-08-24 per ongeluk in de live database is beland.
-- contact + hero terug naar de seed-waarden uit scripts/seed-admin.ts.

UPDATE site_settings
SET value = '{"email":"","phone":"","whatsapp":"","address":"","city":"","postcode":"","instagram":"https://instagram.com/atelierboterbloem","facebook":"","openingHours":[]}'::jsonb,
    updated_at = now()
WHERE key = 'contact';

UPDATE site_settings
SET value = '{"title":"Atelier Boterbloem","tagline":"Handgemaakte taarten voor jouw mooiste momenten","ctaLabel":"Vraag offerte aan","ctaHref":"/contact","imageFilename":""}'::jsonb,
    updated_at = now()
WHERE key = 'hero';

DELETE FROM contact_requests WHERE id BETWEEN 2 AND 9;

SELECT key, value FROM site_settings ORDER BY key;
SELECT id, name, email FROM contact_requests ORDER BY id;
