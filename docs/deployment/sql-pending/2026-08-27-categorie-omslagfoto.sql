-- Een gelegenheid kan zelf een omslagfoto aanwijzen.
--
-- Aanleiding: de klant leverde twintig foto's aan die niet per event gegroepeerd zijn. Ze komen
-- daarom rechtstreeks onder een gelegenheid te hangen (`gallery_items.album_id IS NULL`), en de
-- eventlaag komt er later onder zodra ze materiaal per feest heeft.
--
-- Daarmee wordt "welke foto is de omslag" een echte vraag. Tot nu toe kwam die omslag altijd van
-- een event, en viel `nest()` in server/routes/public.ts terug op `losseItems[0]` — de eerste op
-- sortOrder. Dat werkte zolang losse foto's restanten waren; nu ze de hoofdmoot zijn, is de
-- omslag een toevalstreffer van de uploadvolgorde.
--
-- `gallery_albums` en `packages` hebben deze kolom allebei al. Gelegenheden waren de enige plek
-- met foto's eronder die hem miste, en dat viel niet op omdat er tot nu toe altijd een event
-- tussen zat.
--
-- Bewust GEEN foreign key, net als bij gallery_albums.cover_item_id: een foto verwijderen mag
-- de gelegenheid niet meeslepen en ook niet blokkeren. De omslag valt dan gewoon terug op de
-- volgorde, wat precies het gedrag van vandaag is.
--
-- 🚨 VÓÓR de code draaien. Drizzle neemt élk schemaveld op in de SELECT, dus zodra
--    shared/schema.ts deze kolom kent breekt élke query op gallery_categories zolang de kolom
--    in de database ontbreekt — niet alleen de nieuwe functionaliteit.
--
-- Additief + idempotent: bestaande gelegenheden houden NULL en gedragen zich exact als nu.

ALTER TABLE gallery_categories
  ADD COLUMN IF NOT EXISTS cover_item_id integer;

-- Verweesde verwijzingen opruimen is geen taak van een constraint maar van de leesquery: die
-- valt terug op de volgorde als de foto niet meer bestaat. Wél alvast schoonmaken wat er nu
-- staat, voor het geval een eerdere handmatige actie iets heeft achtergelaten.
UPDATE gallery_categories c
   SET cover_item_id = NULL
 WHERE c.cover_item_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM gallery_items i WHERE i.id = c.cover_item_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_categories' AND column_name = 'cover_item_id'
  ) THEN
    RAISE EXCEPTION 'gallery_categories.cover_item_id is niet aangemaakt';
  END IF;
  RAISE NOTICE 'Omslagfoto: gallery_categories.cover_item_id staat er.';
END $$;
