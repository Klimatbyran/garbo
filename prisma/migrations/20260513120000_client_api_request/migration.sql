CREATE TABLE "client_api_request" (
    "id" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_api_request_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "client_api_request_key_id_idx" ON "client_api_request"("key_id");
CREATE INDEX "client_api_request_timestamp_idx" ON "client_api_request"("timestamp");

ALTER TABLE "client_api_request" ADD CONSTRAINT "client_api_request_key_id_fkey"
  FOREIGN KEY ("key_id") REFERENCES "client_api_key"("id") ON DELETE CASCADE ON UPDATE CASCADE;
