ALTER TABLE "Equipped" ADD COLUMN "backgroundSkinId" TEXT;

ALTER TABLE "Equipped" ADD CONSTRAINT "Equipped_backgroundSkinId_fkey" FOREIGN KEY ("backgroundSkinId") REFERENCES "Cosmetic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
