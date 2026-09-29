ALTER TABLE "Equipped" ADD COLUMN "pointerSkinId" TEXT;

ALTER TABLE "Equipped" ADD CONSTRAINT "Equipped_pointerSkinId_fkey" FOREIGN KEY ("pointerSkinId") REFERENCES "Cosmetic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
