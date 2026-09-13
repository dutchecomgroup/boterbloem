-- Een product kan zijn prijs als vanaf-prijs tonen.
--
-- Aanleiding: de klant vroeg om een vanaf-prijs voor de bruidstaart. Dat begrip bestond alleen
-- bij pakketten (`packages.price_from`), terwijl `products.base_price` gewoon een bedrag is.
-- Op /aanbod stond wél al hardgecodeerd onder de prijslijst: "Vanaf-prijzen per taart. De
-- uiteindelijke prijs hangt af van het ontwerp." De site beweerde dus iets wat in de data niet
-- bestond, en dat gold meteen voor élke regel -- ook voor een vaste schaal mini desserts.
--
-- Per product een keuze, want de twee gevallen bestaan naast elkaar: een bruidstaart op maat
-- begint ergens, een basistaart van 12 personen kost gewoon wat hij kost.
--
-- 🚨 VÓÓR de code draaien. Drizzle neemt élk schemaveld op in de SELECT, dus zodra
--    shared/schema.ts deze kolom kent breekt élke query op products zolang de kolom in de
--    database ontbreekt -- niet alleen de nieuwe functionaliteit.
--
-- Additief + idempotent. De twee ALTER-regels hieronder staan bewust in deze volgorde:
--
--   1. `ADD COLUMN ... DEFAULT true` vult de bestaande rijen met `true`. Dat is precies wat de
--      site vandaag al over al haar taarten zegt, dus na deze migratie verandert er niets aan
--      wat een bezoeker leest.
--   2. `ALTER COLUMN ... SET DEFAULT false` zet de standaard voor álles wat hierna wordt
--      aangemaakt. Een vanaf-prijs is een bewering die je bewust doet, geen stilzwijgend
--      uitgangspunt.
--
-- Bij een tweede run slaat stap 1 zichzelf over (IF NOT EXISTS) en is stap 2 een no-op.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_is_from boolean NOT NULL DEFAULT true;

ALTER TABLE products
  ALTER COLUMN price_is_from SET DEFAULT false;

DO $$
DECLARE
  standaard text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price_is_from'
  ) THEN
    RAISE EXCEPTION 'products.price_is_from is niet aangemaakt';
  END IF;

  SELECT column_default INTO standaard
    FROM information_schema.columns
   WHERE table_name = 'products' AND column_name = 'price_is_from';

  IF standaard IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'products.price_is_from heeft standaard % in plaats van false', standaard;
  END IF;

  IF EXISTS (SELECT 1 FROM products WHERE price_is_from IS NULL) THEN
    RAISE EXCEPTION 'products.price_is_from bevat NULL-waarden';
  END IF;

  RAISE NOTICE 'Vanaf-prijs: products.price_is_from staat er, bestaande regels op true, nieuwe op false.';
END $$;
