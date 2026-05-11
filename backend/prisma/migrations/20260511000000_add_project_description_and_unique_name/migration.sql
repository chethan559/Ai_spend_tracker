-- Add description column to Project
ALTER TABLE "Project" ADD COLUMN "description" TEXT;

-- Add unique constraint on (userId, name)
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_name_key" UNIQUE ("userId", "name");
