-- Cheap Scope 1/2/3 mention gate results on the registry report, so we can
-- skip LLM extraction for reports without emissions language and still know
-- we already checked them.
ALTER TABLE "Report" ADD COLUMN "has_emissions_mentions" BOOLEAN;
ALTER TABLE "Report" ADD COLUMN "emissions_presence_checked_at" TIMESTAMP(3);
