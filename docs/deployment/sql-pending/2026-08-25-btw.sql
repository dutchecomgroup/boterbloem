-- Btw op de offerte: één kolom op `orders` en een standaardtarief in de instellingen.
--
-- Aanleiding: de offerte kan niet gebouwd worden zonder te weten of er btw op moet. Drie
-- mogelijkheden, en de derde is een echte:
--   geen  — kleineondernemersregeling: er komt géén btw-regel op de offerte
--   laag  — 9%, het tarief voor eten en drinken
--   hoog  — 21%
--
-- Bedragen zijn **inclusief** btw. Voor een particuliere klant is dat de enige juiste keuze:
-- wat op de offerte staat is wat ze betaalt. De btw wordt er op de offerte uit gehaald
-- ("waarvan € 30,60 btw"), niet bij opgeteld. Daarom verandert er niets aan `total_price` en
-- hoeft geen enkel bestaand bedrag herrekend te worden.
--
-- 🚨 VÓÓR de code draaien — zie de kop van 2026-08-25-boekingen.sql voor het waarom.
--
-- Additief + idempotent. Mag twee keer draaien zonder schade.

-- ---------------------------------------------------------------------------
-- 1. Tarief per boeking
-- ---------------------------------------------------------------------------
-- NULL = "volg de standaard uit site_settings.btw". Bewust geen default-waarde in de kolom:
-- dan zou elke bestaande boeking een expliciete keuze krijgen die niemand gemaakt heeft, en
-- zou een latere wijziging van het standaardtarief die boekingen niet meer bereiken.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS vat_rate varchar(8);

-- Geen onzinwaarden. `varchar` zonder controle laat 'hoogg' of '9%' gewoon toe, en dat merk je
-- pas als er een offerte uitrolt met een leeg btw-blok.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_vat_rate_geldig'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_vat_rate_geldig
      CHECK (vat_rate IS NULL OR vat_rate IN ('geen', 'laag', 'hoog'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Standaardtarief in de instellingen
-- ---------------------------------------------------------------------------
-- Het tarief is een eigenschap van het bedrijf, niet van één boeking. Standaard op 'geen':
-- dat is de veilige aanname zolang de klant het niet bevestigd heeft — er verschijnt dan geen
-- btw-regel, in plaats van een bedrag dat er misschien niet hoort te staan.

INSERT INTO site_settings (key, value)
VALUES ('btw', '{"standaardTarief":"geen","toelichting":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Controle na afloop (informatief — verandert niets)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  ongeldig int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'vat_rate'
  ) THEN
    RAISE EXCEPTION 'orders.vat_rate is niet aangemaakt';
  END IF;

  SELECT count(*) INTO ongeldig
  FROM orders WHERE vat_rate IS NOT NULL AND vat_rate NOT IN ('geen', 'laag', 'hoog');
  IF ongeldig > 0 THEN
    RAISE EXCEPTION 'Er staan % boekingen met een ongeldig btw-tarief', ongeldig;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM site_settings WHERE key = 'btw') THEN
    RAISE EXCEPTION 'De btw-instelling ontbreekt';
  END IF;

  RAISE NOTICE 'Btw: orders.vat_rate en site_settings.btw staan er.';
END $$;
