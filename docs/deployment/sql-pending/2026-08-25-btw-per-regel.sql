-- Btw per regel, per pakket (met verdeling) en per product.
--
-- Aanleiding, in de woorden van de klant: *"ik kan bijv. ook styling of andere dingen aanbieden
-- die wel 21% zijn, dus dit hangt soms ook af van de regel."*
--
-- Klopt, en daarmee is het model van 2026-08-25-btw.sql te grof. Eén offerte kan twee tarieven
-- bevatten: de grazing table valt onder 9% (eten en drinken), de styling, het glaswerk en de
-- opbouw ernaast onder 21%. Met één tarief voor de hele boeking staat er dan een bedrag op de
-- offerte dat gewoon fout is, en bij btw is "ongeveer goed" niet goed genoeg.
--
-- `orders.vat_rate` blijft bestaan en verandert van betekenis niet: het is nu de waarde die
-- geldt voor elke regel die zelf niets zegt. De volgorde is dus regel → boeking → instelling.
--
-- Bedragen blijven **inclusief** btw, dus er wordt niets herrekend: `line_total` en
-- `total_price` blijven precies zoals ze zijn. Alleen de uitsplitsing op de offerte verandert.
--
-- 🚨 VÓÓR de code draaien — zie de kop van 2026-08-25-boekingen.sql voor het waarom.
--
-- Additief + idempotent. Mag twee keer draaien zonder schade.

-- ---------------------------------------------------------------------------
-- 1. Tarief per regel
-- ---------------------------------------------------------------------------
-- NULL = "volg de boeking". Bewust geen default: een expliciete waarde op elke bestaande regel
-- zou een keuze vastleggen die niemand gemaakt heeft, en een latere wijziging van het
-- standaardtarief zou die regels dan niet meer bereiken.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS vat_rate varchar(8);

-- Dezelfde controle als op `orders`. Zonder deze laat varchar 'hoogg' of '9%' gewoon toe, en
-- dat merk je pas als er een offerte uitrolt met een leeg of verkeerd btw-blok.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_vat_rate_geldig'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_vat_rate_geldig
      CHECK (vat_rate IS NULL OR vat_rate IN ('geen', 'laag', 'hoog'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Tarief per pakket
-- ---------------------------------------------------------------------------
-- Het pakket weet wat het is: een grazing table is eten (9%), een stylingpakket is 21%. Een
-- regel die uit dit pakket ontstaat krijgt dit tarief als startwaarde mee.
--
-- Zonder dit zou bij elke boeking opnieuw bedacht moeten worden welk tarief bij welk pakket
-- hoort, en dat is precies het soort herhaald handwerk waar fouten in sluipen.
--
-- NULL = volg de boeking. Ook hier geen default, om dezelfde reden als hierboven.

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS vat_rate varchar(8);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packages_vat_rate_geldig'
  ) THEN
    ALTER TABLE packages
      ADD CONSTRAINT packages_vat_rate_geldig
      CHECK (vat_rate IS NULL OR vat_rate IN ('geen', 'laag', 'hoog'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Btw-verdeling van een pakketprijs
-- ---------------------------------------------------------------------------
-- Een sweet table bevat eten (9%) én verhuur, materiaal en opbouw (21%). De Belastingdienst
-- staat niet toe dat het 21%-deel meelift op het lage tarief; bij één prijs naar de klant moet
-- het bedrag aan de achterkant gesplitst worden volgens de marktwaarde.
--
-- Per eenheid, net als `price_from`. Staat `price_unit` op 'per_persoon', dan zijn dit bedragen
-- per persoon: € 22,00 eten en € 3,00 servies bij een pakketprijs van € 25,00 p.p. Het aantal
-- op de regel doet de vermenigvuldiging.
--
-- Allebei NULL = geen verdeling; dan is het pakket één regel met `packages.vat_rate`.

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS vat_split_low  numeric(10,2),
  ADD COLUMN IF NOT EXISTS vat_split_high numeric(10,2);

-- Een negatieve deelprijs is geen korting maar een typefout, en die hoort niet stil door te
-- werken in een btw-berekening.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packages_vat_split_niet_negatief'
  ) THEN
    ALTER TABLE packages
      ADD CONSTRAINT packages_vat_split_niet_negatief
      CHECK (
        (vat_split_low IS NULL OR vat_split_low >= 0) AND
        (vat_split_high IS NULL OR vat_split_high >= 0)
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Tarief per product
-- ---------------------------------------------------------------------------
-- De taart-prijslijst. Geen verdeling: een taart is één ding, en dat ding is eten.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS vat_rate varchar(8);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_vat_rate_geldig'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_vat_rate_geldig
      CHECK (vat_rate IS NULL OR vat_rate IN ('geen', 'laag', 'hoog'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Controle na afloop (informatief — verandert niets)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  ongeldig int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'vat_rate'
  ) THEN
    RAISE EXCEPTION 'order_items.vat_rate is niet aangemaakt';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'packages' AND column_name = 'vat_split_low'
  ) THEN
    RAISE EXCEPTION 'packages.vat_split_low is niet aangemaakt';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'vat_rate'
  ) THEN
    RAISE EXCEPTION 'products.vat_rate is niet aangemaakt';
  END IF;

  SELECT count(*) INTO ongeldig
  FROM order_items WHERE vat_rate IS NOT NULL AND vat_rate NOT IN ('geen', 'laag', 'hoog');
  IF ongeldig > 0 THEN
    RAISE EXCEPTION 'Er staan % regels met een ongeldig btw-tarief', ongeldig;
  END IF;

  RAISE NOTICE 'Btw-velden staan klaar op order_items, packages en products.';
END $$;
