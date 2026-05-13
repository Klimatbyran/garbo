-- CreateTable
CREATE TABLE "client_api_permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "client_api_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_api_role" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "client_api_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_api_role_permission" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "client_api_role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "client_api_key" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_lookup" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_api_permission_code_key" ON "client_api_permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "client_api_role_slug_key" ON "client_api_role"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "client_api_key_key_lookup_key" ON "client_api_key"("key_lookup");

-- AddForeignKey
ALTER TABLE "client_api_role_permission" ADD CONSTRAINT "client_api_role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "client_api_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_api_role_permission" ADD CONSTRAINT "client_api_role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "client_api_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_api_key" ADD CONSTRAINT "client_api_key_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "client_api_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
