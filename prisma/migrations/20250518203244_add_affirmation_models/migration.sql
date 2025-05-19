-- CreateTable
CREATE TABLE "affirmations" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "author" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_affirmations" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "affirmationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_affirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_affirmations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "affirmationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_daily_affirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_affirmations_date_key" ON "daily_affirmations"("date");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_affirmations_userId_date_key" ON "user_daily_affirmations"("userId", "date");

-- AddForeignKey
ALTER TABLE "daily_affirmations" ADD CONSTRAINT "daily_affirmations_affirmationId_fkey" FOREIGN KEY ("affirmationId") REFERENCES "affirmations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_affirmations" ADD CONSTRAINT "user_daily_affirmations_affirmationId_fkey" FOREIGN KEY ("affirmationId") REFERENCES "affirmations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
