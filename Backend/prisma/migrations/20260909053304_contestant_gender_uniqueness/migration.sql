/*
  Warnings:

  - A unique constraint covering the columns `[candidateNumber,gender]` on the table `Contestant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Contestant_candidateNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Contestant_candidateNumber_gender_key" ON "Contestant"("candidateNumber", "gender");
