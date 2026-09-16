-- Optional groupings for Validate coverage lists (country indexes, MSCI, client lists, etc.).

CREATE TABLE "coverage_list_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "coverage_list_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coverage_list_groups_slug_key" ON "coverage_list_groups"("slug");

ALTER TABLE "coverage_lists" ADD COLUMN "group_id" TEXT;

CREATE INDEX "coverage_lists_group_id_idx" ON "coverage_lists"("group_id");

ALTER TABLE "coverage_lists"
ADD CONSTRAINT "coverage_lists_group_id_fkey"
FOREIGN KEY ("group_id") REFERENCES "coverage_list_groups"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "coverage_list_groups" ("id", "slug", "label") VALUES
  ('cmgcountryindexes01', 'country_indexes', 'Country indexes'),
  ('cmgmsciacwi00000001', 'msci_acwi', 'MSCI ACWI'),
  ('cmgclientlists00001', 'client_lists', 'Client lists');
