-- Betalingen als losse regels, zodat "ontvangen" een echt bedrag wordt.
--
-- Aanleiding: boeking ABB-2026-014 stond op `afgeleverd` met een totaal van EUR 295,00 en bleef
-- toch op "Openstaand EUR 295,00" staan, terwijl er nergens omzet verscheen. Twee oorzaken, en
-- allebei zitten ze in het model:
--
--   1. `orders.paid_at` werd door de hele codebase alleen gelézen (stats.ts). Geen route, geen
--      script en geen migratie schreef hem ooit. De omzettegels en de 12-maandsgrafiek filterden
--      op `paid_at IS NOT NULL` en stonden daarmee structureel op nul -- voor elke boeking, altijd.
--   2. Er was geen manier om "de rest is ook betaald" vast te leggen. Het model kende alleen
--      `deposit_amount` (afgesproken) en `deposit_paid` (binnen), dus ontvangen kon nooit meer
--      worden dan de aanbetaling.
--
-- Een tabel en geen tweede vinkje, om drie redenen: een klant betaalt vaak in delen, je wilt
-- kunnen zien wánneer er betaald is, en een bedrag corrigeren hoort geen geschiedenis te wissen.
--
-- `deposit_amount` blijft en behoudt zijn betekenis: het **afgesproken** bedrag, dat op de
-- offerte staat als "nu te voldoen". `deposit_paid` en `paid_at` worden hierna door de code niet
-- meer gelezen; ze blijven staan omdat deze migratie additief is, en gaan pas weg als er een
-- ronde is geweest waarin niets ze mist.
--
-- 🚨 VÓÓR de code draaien, en ná `boekingen.sql` -- deze tabel verwijst naar `orders`.
--    Additief + idempotent.

CREATE TABLE IF NOT EXISTS order_payments (
  id          serial PRIMARY KEY,
  order_id    integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount      numeric(10,2) NOT NULL,
  paid_on     date NOT NULL,
  method      varchar(32),
  note        text,
  created_at  timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_payments_order_idx   ON order_payments (order_id, paid_on);
CREATE INDEX IF NOT EXISTS order_payments_paid_on_idx ON order_payments (paid_on);

-- Onzin buiten de deur houden: een methode die de applicatie niet kent hoort er niet in te
-- kunnen belanden via een handmatige INSERT.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_payments_method_bekend') THEN
    ALTER TABLE order_payments
      ADD CONSTRAINT order_payments_method_bekend
      CHECK (method IS NULL OR method IN ('contant', 'overboeking', 'tikkie', 'anders'));
  END IF;
END $$;

-- Wat er al vastlag overzetten: een aanbetaling die als betaald gemarkeerd stond, is een
-- ontvangen bedrag. Zonder deze stap zou de omzetpagina zeggen dat er nooit iets binnenkwam.
--
-- De datum is `orders.created_at`, niet vandaag: wanneer het geld precies binnenkwam is niet
-- vastgelegd, en de aanmaakdatum van de boeking ligt daar het dichtst bij. Vandaag invullen zou
-- oude betalingen in de huidige maand laten opduiken en de cijfers vervuilen.
--
-- Idempotent via de NOT EXISTS: een tweede run vindt de regel al en slaat hem over.
INSERT INTO order_payments (order_id, amount, paid_on, method, note)
SELECT o.id, o.deposit_amount, o.created_at::date, NULL, 'Overgenomen uit de aanbetaling'
FROM orders o
WHERE o.deposit_paid = true
  AND o.deposit_amount > 0
  AND NOT EXISTS (SELECT 1 FROM order_payments p WHERE p.order_id = o.id);

DO $$
DECLARE
  overgezet integer;
  openstaand integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_payments') THEN
    RAISE EXCEPTION 'order_payments is niet aangemaakt';
  END IF;

  SELECT count(*) INTO overgezet FROM order_payments WHERE note = 'Overgenomen uit de aanbetaling';

  -- Elke betaalde aanbetaling hoort nu een regel te hebben. Blijft er één over, dan is de
  -- overzetting onvolledig en klopt "ontvangen" straks niet.
  SELECT count(*) INTO openstaand
  FROM orders o
  WHERE o.deposit_paid = true AND o.deposit_amount > 0
    AND NOT EXISTS (SELECT 1 FROM order_payments p WHERE p.order_id = o.id);

  IF openstaand > 0 THEN
    RAISE EXCEPTION 'Nog % betaalde aanbetaling(en) zonder betaalregel', openstaand;
  END IF;

  RAISE NOTICE 'Betalingen: tabel staat er, % aanbetaling(en) overgezet.', overgezet;
END $$;
