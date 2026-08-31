-- Fase 1 — het gebundelde schema-werk voor de wensen uit de meeting van 24-08.
--
-- Waarom in één bestand: elke schemawijziging raakt de live database, dus hoe minder
-- losse rondes hoe kleiner het risico. Alles hieronder is ADDITIEF en IDEMPOTENT — er
-- verdwijnt geen kolom, er wordt niets hernoemd, en het bestand mag twee keer draaien
-- zonder schade.
--
-- 🚨 VÓÓR de code draaien. Drizzle neemt élk schemaveld op in de SELECT, dus zodra
--    shared/schema.ts een kolom kent die de database niet heeft, breekt élke query op
--    die tabel — niet alleen de nieuwe functionaliteit.
--
-- Plannen: docs/komende-plannen/3-onaangeraakt/{portfolio-categorie-albums,
--          pakketten-en-prijzen,agenda-boekingen,content-reviews,
--          aanvragen-formulier-uitbreiding}.md

-- ---------------------------------------------------------------------------
-- 1. packages — sweet/grazing tables met een vanaf-prijs
-- ---------------------------------------------------------------------------
-- Aparte tabel en niet `products` uitbreiden: een pakket is een richtprijs mét een
-- verhaal (personen-bereik, "wat zit erin"), de taartenlijst is een kale prijslijst.
-- Twee tabellen, twee schermen, elk simpel.

CREATE TABLE IF NOT EXISTS packages (
  id            serial PRIMARY KEY,
  slug          varchar(120)  NOT NULL,
  name          varchar(200)  NOT NULL,
  tagline       varchar(255),
  description   text,
  -- Geld als numeric(10,2), conform de conventie in CLAUDE.md. Nooit float.
  price_from    numeric(10,2) NOT NULL DEFAULT '0',
  price_unit    varchar(32)   NOT NULL DEFAULT 'totaal',   -- 'totaal' | 'per_persoon'
  persons_min   integer,
  persons_max   integer,
  -- Lijst met wat er in het pakket zit, als array van strings.
  includes      jsonb         NOT NULL DEFAULT '[]'::jsonb,
  cover_item_id integer       REFERENCES gallery_items(id) ON DELETE SET NULL,
  featured      boolean       NOT NULL DEFAULT false,
  -- Standaard NIET actief: de drie pakketten worden geseed zonder prijzen, en horen
  -- pas op de site te verschijnen als de klant die heeft doorgegeven.
  active        boolean       NOT NULL DEFAULT false,
  sort_order    integer       NOT NULL DEFAULT 0,
  created_at    timestamp     NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS packages_slug_unique ON packages (slug);

-- ---------------------------------------------------------------------------
-- 2. gallery_albums — de event-laag tussen categorie en foto
-- ---------------------------------------------------------------------------
-- Uit de meeting: "niet een los event zien maar meer dat je de optie biedt voor een
-- babyshower met een weergave van meerdere events". Categorie = gelegenheid,
-- album = één uitgevoerd event.

CREATE TABLE IF NOT EXISTS gallery_albums (
  id            serial PRIMARY KEY,
  -- CASCADE: een album zonder gelegenheid heeft geen plek op de site. Het scherm vraagt
  -- vóór het verwijderen om bevestiging met het aantal betrokken albums.
  category_id   integer      REFERENCES gallery_categories(id) ON DELETE CASCADE,
  slug          varchar(120) NOT NULL,
  title         varchar(200) NOT NULL,
  event_date    date,
  description   text,
  cover_item_id integer      REFERENCES gallery_items(id) ON DELETE SET NULL,
  sort_order    integer      NOT NULL DEFAULT 0,
  published     boolean      NOT NULL DEFAULT true,
  created_at    timestamp    NOT NULL DEFAULT now()
);

-- Slug hoeft alleen binnen een gelegenheid uniek te zijn: /galerij/babyshower/lisa-maart
CREATE UNIQUE INDEX IF NOT EXISTS gallery_albums_cat_slug_unique
  ON gallery_albums (category_id, slug);
CREATE INDEX IF NOT EXISTS gallery_albums_category_idx ON gallery_albums (category_id);

-- ---------------------------------------------------------------------------
-- 3. reviews
-- ---------------------------------------------------------------------------
-- Vervangt de verzonnen TESTIMONIALS-array die nu in HomePage.tsx staat.

CREATE TABLE IF NOT EXISTS reviews (
  id          serial PRIMARY KEY,
  author_name varchar(120) NOT NULL,
  event_type  varchar(120),
  rating      integer,
  body        text         NOT NULL,
  occurred_on date,
  -- Standaard NIET gepubliceerd: publiceren hoort een bewuste handeling te zijn, ook
  -- omdat er toestemming van de persoon in kwestie nodig is voor een naam op de site.
  published   boolean      NOT NULL DEFAULT false,
  featured    boolean      NOT NULL DEFAULT false,
  sort_order  integer      NOT NULL DEFAULT 0,
  source      varchar(32)  NOT NULL DEFAULT 'handmatig',
  created_at  timestamp    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_published_idx ON reviews (published);

-- Cijfer 1–5 of leeg. Losse DO-blok want CREATE CONSTRAINT kent geen IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_rating_range'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_rating_range
      CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Kolommen op bestaande tabellen
-- ---------------------------------------------------------------------------

-- Foto hangt onder een album; NULL blijft toegestaan zodat een losse foto direct onder
-- een gelegenheid kan blijven staan.
ALTER TABLE gallery_items
  ADD COLUMN IF NOT EXISTS album_id integer REFERENCES gallery_albums(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS gallery_album_idx ON gallery_items (album_id);

-- Introtekst per gelegenheid + tijdelijk verbergen zonder verwijderen.
ALTER TABLE gallery_categories
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS published   boolean NOT NULL DEFAULT true;

-- De taart-prijslijst wordt publiek. Default false: bestaande producten verschijnen niet
-- vanzelf op de site, de klant zet ze bewust aan.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT false;

-- Voor de agenda. event_date blijft `date` zonder tijd (conventie in CLAUDE.md); de tijd
-- komt in een eigen kolom zodat "datum bekend, tijd nog niet" een geldige toestand blijft.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS event_time time,
  ADD COLUMN IF NOT EXISTS location   text;

-- Gelegenheid + gewenst pakket uit het contactformulier. Beide SET NULL: een aanvraag
-- blijft leesbaar als het pakket of de categorie later verdwijnt.
ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS package_id  integer REFERENCES packages(id)            ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id integer REFERENCES gallery_categories(id)  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Controle na afloop (informatief — draait mee, verandert niets)
-- ---------------------------------------------------------------------------
DO $$
DECLARE ontbreekt text;
BEGIN
  SELECT string_agg(t, ', ') INTO ontbreekt FROM (
    SELECT 'packages'       AS t WHERE to_regclass('public.packages')       IS NULL
    UNION ALL
    SELECT 'gallery_albums'      WHERE to_regclass('public.gallery_albums') IS NULL
    UNION ALL
    SELECT 'reviews'             WHERE to_regclass('public.reviews')        IS NULL
  ) x;

  IF ontbreekt IS NOT NULL THEN
    RAISE EXCEPTION 'Migratie onvolledig, ontbrekende tabellen: %', ontbreekt;
  END IF;

  RAISE NOTICE 'Fase 1: packages, gallery_albums en reviews staan er.';
END $$;
