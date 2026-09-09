/*
  Warnings:

  - The primary key for the `RoundWinner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `gender` to the `RoundWinner` table without a default value. This is not possible if the table is not empty.

  Backfilled from `Contestant.gender` for any existing rows before the column is made required, so this migration is safe to run against non-empty tables (e.g. rounds that already had winners declared).
*/
-- AlterTable
ALTER TABLE "RoundWinner"
DROP CONSTRAINT "RoundWinner_pkey",
ADD COLUMN "gender" "Gender";

-- Backfill existing rows from the related Contestant
UPDATE "RoundWinner" AS "rw"
SET "gender" = "c"."gender"
FROM "Contestant" AS "c"
WHERE "c"."id" = "rw"."contestantId";

-- AlterTable
ALTER TABLE "RoundWinner"
ALTER COLUMN "gender" SET NOT NULL,
ADD CONSTRAINT "RoundWinner_pkey" PRIMARY KEY ("roundId", "gender", "placement");
