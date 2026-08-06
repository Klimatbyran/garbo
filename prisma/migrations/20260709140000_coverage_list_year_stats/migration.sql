-- Cache coverage match stats on list year editions so list overview reads stay fast.
ALTER TABLE "coverage_list_years"
ADD COLUMN "total_names" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "matched_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "ambiguous_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "coverage_percent" INTEGER NOT NULL DEFAULT 0;
