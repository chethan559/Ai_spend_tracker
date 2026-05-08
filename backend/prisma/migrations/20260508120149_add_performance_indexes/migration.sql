-- CreateIndex
CREATE INDEX "ApiLog_userId_timestamp_desc_idx" ON "ApiLog"("userId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "ApiLog_userId_provider_idx" ON "ApiLog"("userId", "provider");

-- CreateIndex
CREATE INDEX "ApiLog_metadata_idx" ON "ApiLog" USING GIN ("metadata");
