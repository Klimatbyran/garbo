-- Validate Coverage tab: named index lists with per-year company name editions.

CREATE TABLE "coverage_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_lists_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coverage_lists_name_key" ON "coverage_lists"("name");

CREATE TABLE "coverage_list_years" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_list_years_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "coverage_list_years_list_id_idx" ON "coverage_list_years"("list_id");

CREATE UNIQUE INDEX "coverage_list_years_list_id_year_key" ON "coverage_list_years"("list_id", "year");

ALTER TABLE "coverage_list_years" ADD CONSTRAINT "coverage_list_years_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "coverage_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "coverage_list_entries" (
    "id" TEXT NOT NULL,
    "year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "coverage_list_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "coverage_list_entries_year_id_idx" ON "coverage_list_entries"("year_id");

ALTER TABLE "coverage_list_entries" ADD CONSTRAINT "coverage_list_entries_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "coverage_list_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;
