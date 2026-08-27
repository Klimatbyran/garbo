-- Which API process recorded the request (shared DB; values set by each service's gate).
ALTER TABLE "client_api_request" ADD COLUMN "service" TEXT;

CREATE INDEX "client_api_request_service_idx" ON "client_api_request"("service");
