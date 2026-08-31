-- Tekst tussen de foto's van een event.
--
-- Aanleiding: een album had één omschrijving, die vóór alle foto's stond. Genoeg voor een
-- bijschrift, te weinig voor een verhaal. De gebruiker: "ik wil bij de events of de galerijen
-- tekst kunnen plaatsen, zodat het ook informatie heeft."
--
-- `blocks` is een geordende lijst van blokken:
--   { "soort": "kop",   "inhoud": "De taart" }
--   { "soort": "tekst", "inhoud": "Drie lagen, met..." }
--   { "soort": "fotos", "itemIds": [12, 15, 19] }
--
-- Waarom jsonb en geen aparte tabel met sort_order: de volgorde ís hier de betekenis, en een
-- losse tabel met een volgordekolom is precies waar herordenen fout gaat. Dat is in dit
-- project al een keer gebeurd met `sortOrder ± 1` in het galerijscherm.
--
-- `description` blijft bestaan als korte inleiding boven de blokken — hij staat ook op de
-- tegel in het overzicht en is dus geen duplicaat van een tekstblok.
--
-- 🚨 VÓÓR de code draaien. Additief + idempotent; bestaande albums houden `blocks = NULL` en
--    worden dan getoond zoals nu (omschrijving + alle foto's).

ALTER TABLE gallery_albums
  ADD COLUMN IF NOT EXISTS blocks jsonb;

-- Onzin buiten de deur houden: het moet een array zijn, of niets. Zonder deze controle kan er
-- een object of een string in belanden en klapt de weergave eruit op een pagina die publiek is.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gallery_albums_blocks_array') THEN
    ALTER TABLE gallery_albums
      ADD CONSTRAINT gallery_albums_blocks_array
      CHECK (blocks IS NULL OR jsonb_typeof(blocks) = 'array');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_albums' AND column_name = 'blocks'
  ) THEN
    RAISE EXCEPTION 'gallery_albums.blocks is niet aangemaakt';
  END IF;
  RAISE NOTICE 'Albumblokken: gallery_albums.blocks staat er.';
END $$;
