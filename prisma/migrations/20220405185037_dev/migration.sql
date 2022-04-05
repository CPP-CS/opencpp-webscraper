/*
  Warnings:

  - Made the column `CourseNumber` on table `sections` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Section` on table `sections` required. This step will fail if there are existing NULL values in that column.
  - Made the column `Subject` on table `sections` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `sections` MODIFY `CourseNumber` VARCHAR(191) NOT NULL,
    MODIFY `Section` VARCHAR(191) NOT NULL,
    MODIFY `Subject` VARCHAR(191) NOT NULL;
