/*
  Warnings:

  - Made the column `Subject` on table `instructions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `CourseNumber` on table `instructions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `instructions` ADD COLUMN `courseId` INTEGER NULL,
    ADD COLUMN `instructorId` INTEGER NULL,
    MODIFY `Subject` VARCHAR(191) NOT NULL,
    MODIFY `CourseNumber` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Subject` VARCHAR(191) NULL,
    `CourseNumber` VARCHAR(191) NULL,
    `TotalEnrollment` INTEGER NULL,
    `AvgGPA` DOUBLE NULL,
    `Label` VARCHAR(191) NULL,

    UNIQUE INDEX `courses_Subject_CourseNumber_key`(`Subject`, `CourseNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `InstructorFirst` VARCHAR(191) NULL,
    `InstructorLast` VARCHAR(191) NULL,
    `TotalEnrollment` INTEGER NULL,
    `AvgGPA` DOUBLE NULL,
    `Label` VARCHAR(191) NULL,

    UNIQUE INDEX `instructors_InstructorFirst_InstructorLast_key`(`InstructorFirst`, `InstructorLast`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `instructions` ADD CONSTRAINT `instructions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructions` ADD CONSTRAINT `instructions_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
