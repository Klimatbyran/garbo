-- Staff confirmed a list name has no DB company match (overrides ambiguous auto-match).

ALTER TABLE "coverage_list_entries" ADD COLUMN "match_confirmed_missing" BOOLEAN NOT NULL DEFAULT false;
