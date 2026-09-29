-- Optional crawl locale on coverage lists (country priors for overnight crawl).

CREATE TABLE "coverage_list_locales" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "coverage_list_locales_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coverage_list_locales_slug_key" ON "coverage_list_locales"("slug");

ALTER TABLE "coverage_lists" ADD COLUMN "locale_id" TEXT;

CREATE INDEX "coverage_lists_locale_id_idx" ON "coverage_lists"("locale_id");

ALTER TABLE "coverage_lists"
ADD CONSTRAINT "coverage_lists_locale_id_fkey"
FOREIGN KEY ("locale_id") REFERENCES "coverage_list_locales"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed crawl-locale slugs (passed to discovery as `country` strings).
INSERT INTO "coverage_list_locales" ("id", "slug", "label") VALUES
  ('cmlsweden0000000001', 'sweden', 'Sweden'),
  ('cmlnorway0000000001', 'norway', 'Norway'),
  ('cmlfinland000000001', 'finland', 'Finland'),
  ('cmldenmark000000001', 'denmark', 'Denmark'),
  ('cmliceland000000001', 'iceland', 'Iceland'),
  ('cmlusa0000000000001', 'usa', 'United States'),
  ('cmluk00000000000001', 'uk', 'United Kingdom'),
  ('cmlgermany000000001', 'germany', 'Germany'),
  ('cmlfrance0000000001', 'france', 'France'),
  ('cmlnetherlands00001', 'netherlands', 'Netherlands'),
  ('cmlbelgium000000001', 'belgium', 'Belgium'),
  ('cmlswitzerland00001', 'switzerland', 'Switzerland'),
  ('cmlaustria000000001', 'austria', 'Austria'),
  ('cmlireland000000001', 'ireland', 'Ireland'),
  ('cmlitaly00000000001', 'italy', 'Italy'),
  ('cmlspain00000000001', 'spain', 'Spain'),
  ('cmlportugal00000001', 'portugal', 'Portugal'),
  ('cmlpoland0000000001', 'poland', 'Poland'),
  ('cmljapan00000000001', 'japan', 'Japan'),
  ('cmlcanada0000000001', 'canada', 'Canada'),
  ('cmlaustralia0000001', 'australia', 'Australia'),
  ('cmlchina00000000001', 'china', 'China'),
  ('cmlhongkong00000001', 'hong-kong', 'Hong Kong'),
  ('cmlsingapore0000001', 'singapore', 'Singapore'),
  ('cmlsouthkorea000001', 'south-korea', 'South Korea'),
  ('cmltaiwan0000000001', 'taiwan', 'Taiwan'),
  ('cmlindia00000000001', 'india', 'India'),
  ('cmlbrazil0000000001', 'brazil', 'Brazil'),
  ('cmlmexico0000000001', 'mexico', 'Mexico'),
  ('cmlsouthafrica00001', 'south-africa', 'South Africa'),
  ('cmlisrael0000000001', 'israel', 'Israel'),
  ('cmlnewzealand000001', 'new-zealand', 'New Zealand');
