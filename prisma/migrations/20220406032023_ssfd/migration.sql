/*
  Warnings:

  - A unique constraint covering the columns `[InstructorFirst,InstructorLast,Subject,CourseNumber]` on the table `instructions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `instructions_InstructorFirst_InstructorLast_key` ON `instructions`;

-- DropIndex
DROP INDEX `instructions_Subject_CourseNumber_key` ON `instructions`;

-- AlterTable
ALTER TABLE `instructions` MODIFY `Subject` VARCHAR(191) NULL,
    MODIFY `CourseNumber` VARCHAR(191) NULL,
    MODIFY `InstructorFirst` VARCHAR(191) NULL,
    MODIFY `InstructorLast` VARCHAR(191) NULL,
    MODIFY `AvgGPA` DOUBLE NULL;

-- AlterTable
ALTER TABLE `sections` MODIFY `InstructorFirst` VARCHAR(191) NULL,
    MODIFY `InstructorLast` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `instructions_InstructorFirst_InstructorLast_Subject_CourseNu_key` ON `instructions`(`InstructorFirst`, `InstructorLast`, `Subject`, `CourseNumber`);
