-- Wat er in een regel zit, als subregels onder die regel.
--
-- Aanleiding: een pakket werd zes regels — de hoofdregel plus elke "inbegrepen" als aparte
-- regel van € 0,00. Dat maakt de regeltabel en de offerte onleesbaar en suggereert dat er zes
-- posten zijn. Het wordt één regel met het volledige bedrag, en wat erin zit staat eronder als
-- uitklapbare subregels.
--
-- Waaróm opgeslagen en niet opgezocht bij het pakket: een pakket kan later veranderen of
-- verdwijnen, maar wat er met déze klant is afgesproken hoort te blijven staan. Dezelfde reden
-- waarom een regel zijn eigen omschrijving en prijs houdt als het product uit de prijslijst
-- verdwijnt.
--
-- 🚨 VÓÓR de code draaien — zie de kop van 2026-08-25-boekingen.sql.
--
-- Additief + idempotent.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS details jsonb;

-- ---------------------------------------------------------------------------
-- Bestaande "· "-regels opruimen
-- ---------------------------------------------------------------------------
-- De regels die de vorige versie aanmaakte zijn te herkennen: bedrag € 0,00 en een
-- omschrijving die met "· " begint. Die worden samengevoegd tot subregels van de regel
-- erboven, en daarna verwijderd.
--
-- Alleen binnen dezelfde boeking, en alleen als er een regel mét bedrag boven staat.

WITH punten AS (
  SELECT
    i.id,
    i.order_id,
    i.sort_order,
    substring(i.description from 3) AS tekst,
    -- De dichtstbijzijnde regel erboven binnen dezelfde boeking die géén "· "-regel is.
    (
      SELECT h.id FROM order_items h
      WHERE h.order_id = i.order_id
        AND h.sort_order < i.sort_order
        AND h.description NOT LIKE '· %'
      ORDER BY h.sort_order DESC
      LIMIT 1
    ) AS hoofd_id
  FROM order_items i
  WHERE i.description LIKE '· %' AND i.line_total = 0
),
gebundeld AS (
  SELECT hoofd_id, jsonb_agg(tekst ORDER BY sort_order) AS lijst
  FROM punten
  WHERE hoofd_id IS NOT NULL
  GROUP BY hoofd_id
)
UPDATE order_items o
SET details = jsonb_build_object('inbegrepen', g.lijst)
FROM gebundeld g
WHERE o.id = g.hoofd_id
  AND o.details IS NULL;

DELETE FROM order_items
WHERE description LIKE '· %'
  AND line_total = 0
  AND EXISTS (
    SELECT 1 FROM order_items h
    WHERE h.order_id = order_items.order_id
      AND h.sort_order < order_items.sort_order
      AND h.description NOT LIKE '· %'
  );

-- ---------------------------------------------------------------------------
-- Controle na afloop (informatief — verandert niets)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rest int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'details'
  ) THEN
    RAISE EXCEPTION 'order_items.details is niet aangemaakt';
  END IF;

  SELECT count(*) INTO rest FROM order_items WHERE description LIKE '· %' AND line_total = 0;
  IF rest > 0 THEN
    -- Geen fout: dit zijn "· "-regels zonder regel erboven, die laten we met rust.
    RAISE NOTICE 'Er staan nog % losse ·-regels zonder hoofdregel erboven.', rest;
  END IF;

  RAISE NOTICE 'Regeldetails: order_items.details staat er.';
END $$;
