-- AlterTable
ALTER TABLE "client_api_key" ADD COLUMN "expires_at" TIMESTAMP(3);
ALTER TABLE "client_api_key" ADD COLUMN "company_scope" TEXT;
