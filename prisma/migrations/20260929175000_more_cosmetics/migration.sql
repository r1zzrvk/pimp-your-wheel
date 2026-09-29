ALTER TABLE "User" ADD COLUMN "animation" TEXT;

UPDATE "User" SET "animation" = 'shine' WHERE "shineTheme" = true;
