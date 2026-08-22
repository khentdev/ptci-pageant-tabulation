-- CreateTable
CREATE TABLE "RoundWinner" (
    "roundId" INTEGER NOT NULL,
    "contestantId" INTEGER NOT NULL,
    "placement" INTEGER NOT NULL,
    "overallScore" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "RoundWinner_pkey" PRIMARY KEY ("roundId","placement")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoundWinner_roundId_contestantId_key" ON "RoundWinner"("roundId", "contestantId");

-- AddForeignKey
ALTER TABLE "RoundWinner" ADD CONSTRAINT "RoundWinner_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundWinner" ADD CONSTRAINT "RoundWinner_contestantId_fkey" FOREIGN KEY ("contestantId") REFERENCES "Contestant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
