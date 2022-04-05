/*
  Warnings:

  - A unique constraint covering the columns `[Subject,CourseNumber,Section]` on the table `sections` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `sections_Subject_CourseNumber_Section_key` ON `sections`(`Subject`, `CourseNumber`, `Section`);
