-- Add inputTokens/outputTokens with a temporary DEFAULT 0 so the column can
-- be created non-null against the 465 existing rows. We then backfill from the
-- old `tokens` column before dropping it and removing the column defaults.

ALTER TABLE "ApiLog" ADD COLUMN "inputTokens"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ApiLog" ADD COLUMN "outputTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ApiLog" ADD COLUMN "latencyMs"    INTEGER;

-- Backfill: treat old total tokens as input tokens (output was never split).
UPDATE "ApiLog" SET "inputTokens" = tokens;

-- Drop the now-redundant tokens column.
ALTER TABLE "ApiLog" DROP COLUMN "tokens";

-- Remove column defaults so future inserts must supply explicit values.
ALTER TABLE "ApiLog" ALTER COLUMN "inputTokens"  DROP DEFAULT;
ALTER TABLE "ApiLog" ALTER COLUMN "outputTokens" DROP DEFAULT;

-- Budget alert fields
ALTER TABLE "Budget" ADD COLUMN "alertThreshold"  INTEGER;
ALTER TABLE "Budget" ADD COLUMN "alertChannel"    TEXT;
ALTER TABLE "Budget" ADD COLUMN "slackWebhookUrl" TEXT;

-- BudgetAlert table
CREATE TABLE "BudgetAlert" (
    "id"        TEXT         NOT NULL,
    "budgetId"  TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "threshold" INTEGER      NOT NULL,
    "channel"   TEXT         NOT NULL,
    "sentAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BudgetAlert_budgetId_idx" ON "BudgetAlert"("budgetId");
CREATE INDEX "BudgetAlert_userId_idx"   ON "BudgetAlert"("userId");

ALTER TABLE "BudgetAlert" ADD CONSTRAINT "BudgetAlert_budgetId_fkey"
    FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetAlert" ADD CONSTRAINT "BudgetAlert_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
