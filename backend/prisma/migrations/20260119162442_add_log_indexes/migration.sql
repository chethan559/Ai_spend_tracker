-- DropIndex
DROP INDEX "ApiLog_projectId_idx";

-- DropIndex
DROP INDEX "ApiLog_userId_idx";

-- CreateIndex
CREATE INDEX "ApiLog_userId_timestamp_idx" ON "ApiLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ApiLog_userId_provider_timestamp_idx" ON "ApiLog"("userId", "provider", "timestamp");

-- CreateIndex
CREATE INDEX "ApiLog_userId_projectId_timestamp_idx" ON "ApiLog"("userId", "projectId", "timestamp");

-- CreateIndex
CREATE INDEX "ApiLog_timestamp_idx" ON "ApiLog"("timestamp");
