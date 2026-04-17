-- CreateTable
CREATE TABLE "tag_options" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "tag_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_options_slug_key" ON "tag_options"("slug");
