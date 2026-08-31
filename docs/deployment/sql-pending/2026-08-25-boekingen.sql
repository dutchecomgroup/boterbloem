-- Boekingen bruikbaar maken: velden die een feest beschrijven, een boekingsnummer, en een
-- gebeurtenissenlog voor de tijdlijn in de detailsheet.
--
-- Aanleiding: de boeking bestond alleen als tabelrij. Geen detailscherm, geen regels (de
-- tabel `order_items` werd nergens gebruikt), en gelegenheid/personen/bericht werden als
-- tekstbrij in `notes` gepropt door `POST /orders/from-contact`.
--
-- 🚨 VÓÓR de code draaien. Drizzle neemt élk schemaveld op in de SELECT, dus zodra
--    shared/schema.ts een kolom kent die de database niet heeft, breekt élke query op die
--    tabel — niet alleen de nieuwe functionaliteit.
--
-- Additief + idempotent: geen kolom verdwijnt, niets wordt hernoemd, geen enum krijgt een
-- waarde. Het bestand mag twee keer draaien zonder schade.

-- ---------------------------------------------------------------------------
-- 1. Velden die een feest beschrijven
-- ---------------------------------------------------------------------------

ALTER TABLE orders
  -- Boekingsnummer: nodig op de offerte en om naar te verwijzen aan de telefoon.
  ADD COLUMN IF NOT EXISTS reference   varchar(32),
  -- Welk pakket geboekt is. Kwam wel uit het contactformulier maar verdween in `notes`.
  ADD COLUMN IF NOT EXISTS package_id  integer REFERENCES packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS persons     integer,
  -- Apart veld, bewust níét in de notities: bij eten mag een allergie niet ondersneeuwen
  -- tussen "belt vrijdag over de kleuren".
  ADD COLUMN IF NOT EXISTS allergies   text,
  ADD COLUMN IF NOT EXISTS theme       text,
  -- Hoe laat zij er moet zijn om op te bouwen — los van `event_time` (wanneer het feest is).
  ADD COLUMN IF NOT EXISTS setup_time  time;

-- ---------------------------------------------------------------------------
-- 2. Boekingsnummers voor bestaande boekingen
-- ---------------------------------------------------------------------------
-- ABB-<jaar>-<volgnummer>, per jaar tellend, op volgorde van aanmaak. Alleen rijen die er
-- nog geen hebben, zodat een tweede run niets hernummert.

UPDATE orders o
SET reference = t.nieuw
FROM (
  SELECT
    id,
    'ABB-' || to_char(created_at, 'YYYY') || '-' ||
      lpad(
        row_number() OVER (PARTITION BY to_char(created_at, 'YYYY') ORDER BY created_at, id)::text,
        3, '0'
      ) AS nieuw
  FROM orders
  WHERE reference IS NULL
) t
WHERE t.id = o.id;

CREATE UNIQUE INDEX IF NOT EXISTS orders_reference_unique ON orders (reference);

-- ---------------------------------------------------------------------------
-- 3. order_events — de tijdlijn
-- ---------------------------------------------------------------------------
-- Beantwoordt vragen die anders alleen in iemands hoofd zitten: "wanneer is dit bevestigd?",
-- "is de aanbetaling al binnen?", "wanneer is die regel erbij gekomen?".

CREATE TABLE IF NOT EXISTS order_events (
  id       serial PRIMARY KEY,
  order_id integer     NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  at       timestamp   NOT NULL DEFAULT now(),
  -- aangemaakt | status | regel | betaling | offerte | wijziging
  kind     varchar(32) NOT NULL,
  summary  text        NOT NULL,
  -- Bijv. {"van":"aanvraag","naar":"bevestigd"} of {"bedrag":"125.00"}
  details  jsonb,
  actor    varchar(120)
);

CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events (order_id, at DESC);

-- Elke bestaande boeking krijgt één beginpunt, zodat de tijdlijn niet leeg oogt bij oude
-- boekingen. Alleen als er nog geen 'aangemaakt'-event staat.
INSERT INTO order_events (order_id, at, kind, summary, actor)
SELECT o.id, o.created_at, 'aangemaakt', 'Boeking aangemaakt', NULL
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM order_events e WHERE e.order_id = o.id AND e.kind = 'aangemaakt'
);

-- ---------------------------------------------------------------------------
-- Controle na afloop (informatief — verandert niets)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  zonder_ref  int;
  zonder_evt  int;
BEGIN
  IF to_regclass('public.order_events') IS NULL THEN
    RAISE EXCEPTION 'order_events is niet aangemaakt';
  END IF;

  SELECT count(*) INTO zonder_ref FROM orders WHERE reference IS NULL;
  IF zonder_ref > 0 THEN
    RAISE EXCEPTION 'Er zijn nog % boekingen zonder boekingsnummer', zonder_ref;
  END IF;

  SELECT count(*) INTO zonder_evt
  FROM orders o WHERE NOT EXISTS (SELECT 1 FROM order_events e WHERE e.order_id = o.id);
  IF zonder_evt > 0 THEN
    RAISE EXCEPTION 'Er zijn nog % boekingen zonder beginpunt in de tijdlijn', zonder_evt;
  END IF;

  RAISE NOTICE 'Boekingen: velden, nummers en order_events staan er.';
END $$;
