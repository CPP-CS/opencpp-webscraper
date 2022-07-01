/*
  Warnings:

  - You are about to drop the `post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `post` DROP FOREIGN KEY `Post_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `profile` DROP FOREIGN KEY `Profile_userId_fkey`;

-- DropTable
DROP TABLE `post`;

-- DropTable
DROP TABLE `profile`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ClassCapacity` INTEGER NULL,
    `ClassNumber` INTEGER NULL,
    `ClassTitle` VARCHAR(191) NULL,
    `Component` VARCHAR(191) NULL,
    `CourseNumber` VARCHAR(191) NULL,
    `EndDate` DATETIME(3) NULL,
    `EndTime` DATETIME(3) NULL,
    `Friday` BOOLEAN NULL,
    `InstructionMode` VARCHAR(191) NULL,
    `InstructorFirst` VARCHAR(191) NULL,
    `InstructorLast` VARCHAR(191) NULL,
    `Location` VARCHAR(191) NULL,
    `Monday` BOOLEAN NULL,
    `Saturday` BOOLEAN NULL,
    `Section` VARCHAR(191) NULL,
    `StartDate` DATETIME(3) NULL,
    `StartTime` DATETIME(3) NULL,
    `Subject` VARCHAR(191) NULL,
    `Sunday` BOOLEAN NULL,
    `Term` VARCHAR(191) NULL,
    `Thursday` BOOLEAN NULL,
    `Tuesday` BOOLEAN NULL,
    `TotalEnrollment` INTEGER NULL,
    `Units` DOUBLE NULL,
    `Wednesday` BOOLEAN NULL,
    `A` INTEGER NULL,
    `Am` INTEGER NULL,
    `Bp` INTEGER NULL,
    `B` INTEGER NULL,
    `Bm` INTEGER NULL,
    `Cp` INTEGER NULL,
    `C` INTEGER NULL,
    `Cm` INTEGER NULL,
    `Dp` INTEGER NULL,
    `D` INTEGER NULL,
    `Dm` INTEGER NULL,
    `F` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
