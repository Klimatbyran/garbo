-- Persists docling-parsed markdown on the Report registry row, independently
-- of Chroma, so reindexing/reruns and other consumers (callbackUrl plugins)
-- don't need to re-run docling to get it back.
ALTER TABLE "Report" ADD COLUMN "markdown" TEXT;
