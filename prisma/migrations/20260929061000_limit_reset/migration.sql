CREATE TABLE "LimitReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "spinsGranted" INTEGER NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimitReset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LimitReset_stripeSessionId_key" ON "LimitReset"("stripeSessionId");
CREATE INDEX "LimitReset_userId_day_idx" ON "LimitReset"("userId", "day");

ALTER TABLE "LimitReset" ADD CONSTRAINT "LimitReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
