/*
  Warnings:

  - Made the column `InstructorFirst` on table `sections` required. This step will fail if there are existing NULL values in that column.
  - Made the column `InstructorLast` on table `sections` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `sections` ADD COLUMN `AvgGPA` DOUBLE NULL,
    ADD COLUMN `instructionId` INTEGER NULL,
    MODIFY `InstructorFirst` VARCHAR(191) NOT NULL,
    MODIFY `InstructorLast` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `instructions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Subject` VARCHAR(191) NOT NULL,
    `CourseNumber` VARCHAR(191) NOT NULL,
    `InstructorFirst` VARCHAR(191) NOT NULL,
    `InstructorLast` VARCHAR(191) NOT NULL,
    `TotalEnrollment` INTEGER NULL,
    `AvgGPA` DOUBLE NOT NULL,

    UNIQUE INDEX `instructions_InstructorFirst_InstructorLast_key`(`InstructorFirst`, `InstructorLast`),
    UNIQUE INDEX `instructions_Subject_CourseNumber_key`(`Subject`, `CourseNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_instructionId_fkey` FOREIGN KEY (`instructionId`) REFERENCES `instructions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
