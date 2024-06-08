/*
  Warnings:

  - You are about to drop the column `SessionID` on the `submitedreport` table. All the data in the column will be lost.
  - You are about to drop the column `Value` on the `submitedreport` table. All the data in the column will be lost.
  - You are about to drop the `feedbackinput` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `SessionID` on table `feedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ProgramID` on table `feedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `UserID` on table `feedback` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ProgramID` to the `materials` table without a default value. This is not possible if the table is not empty.
  - Made the column `SessionID` on table `materials` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `program_id` to the `Participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `SessionID` to the `report` table without a default value. This is not possible if the table is not empty.
  - Made the column `AssignmentID` on table `student_assignments_cust` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `FilePath` to the `submitedReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `UserID` to the `submitedReport` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `documenttypeprogram` DROP FOREIGN KEY `documentTypeProgram_ProgramID_fkey`;

-- DropForeignKey
ALTER TABLE `feedbackinput` DROP FOREIGN KEY `FeedbackInput_feedbackID_fkey`;

-- DropForeignKey
ALTER TABLE `student_assignments_cust` DROP FOREIGN KEY `student_assignments_cust_AssignmentID_fkey`;

-- DropForeignKey
ALTER TABLE `trainingsessions` DROP FOREIGN KEY `trainingsessions_MonitorID_fkey`;

-- DropForeignKey
ALTER TABLE `trainingsessions` DROP FOREIGN KEY `trainingsessions_TrainerID_fkey`;

-- AlterTable
ALTER TABLE `feedback` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `SessionID` INTEGER NOT NULL,
    MODIFY `ProgramID` INTEGER NOT NULL,
    MODIFY `UserID` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `materials` ADD COLUMN `ProgramID` INTEGER NOT NULL,
    MODIFY `SessionID` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `participant` ADD COLUMN `program_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `report` ADD COLUMN `SessionID` INTEGER NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `isForMonitor` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isForTrainer` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `student_assignments_cust` MODIFY `AssignmentID` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `submitedreport` DROP COLUMN `SessionID`,
    DROP COLUMN `Value`,
    ADD COLUMN `FilePath` VARCHAR(191) NOT NULL,
    ADD COLUMN `UserID` INTEGER NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropTable
DROP TABLE `feedbackinput`;

-- CreateTable
CREATE TABLE `feedback_type` (
    `InputID` INTEGER NOT NULL AUTO_INCREMENT,
    `feedback_type` VARCHAR(191) NULL,
    `FeedbackID` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`InputID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProgramUsers` (
    `ProgramID` INTEGER NOT NULL,
    `SessionID` INTEGER NOT NULL,
    `UserID` INTEGER NOT NULL,

    PRIMARY KEY (`ProgramID`, `UserID`, `SessionID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedbackResponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `UserID` INTEGER NOT NULL,
    `FeedbackID` INTEGER NOT NULL,
    `response` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deliverables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Title` VARCHAR(255) NOT NULL,
    `FilePath` VARCHAR(255) NULL,
    `UserID` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_deliverables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deliverable_id` INTEGER NOT NULL,
    `FilePath` VARCHAR(255) NULL,
    `ParticipantID` INTEGER NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_assignments_cust` ADD CONSTRAINT `student_assignments_cust_AssignmentID_fkey` FOREIGN KEY (`AssignmentID`) REFERENCES `assignments`(`AssignmentID`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_ProgramID_fkey` FOREIGN KEY (`ProgramID`) REFERENCES `programs`(`ProgramID`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_SessionID_fkey` FOREIGN KEY (`SessionID`) REFERENCES `trainingsessions`(`SessionID`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_ProgramID_fkey` FOREIGN KEY (`ProgramID`) REFERENCES `programs`(`ProgramID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `users`(`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_type` ADD CONSTRAINT `feedback_type_FeedbackID_fkey` FOREIGN KEY (`FeedbackID`) REFERENCES `Feedback`(`FeedbackID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentTypeProgram` ADD CONSTRAINT `documentTypeProgram_ProgramID_fkey` FOREIGN KEY (`ProgramID`) REFERENCES `programs`(`ProgramID`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `report` ADD CONSTRAINT `report_ProgramID_fkey` FOREIGN KEY (`ProgramID`) REFERENCES `programs`(`ProgramID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report` ADD CONSTRAINT `report_SessionID_fkey` FOREIGN KEY (`SessionID`) REFERENCES `trainingsessions`(`SessionID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submitedReport` ADD CONSTRAINT `submitedReport_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `users`(`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`ProgramID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainingsessions` ADD CONSTRAINT `trainingsessions_TrainerID_fkey` FOREIGN KEY (`TrainerID`) REFERENCES `users`(`UserID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `trainingsessions` ADD CONSTRAINT `trainingsessions_MonitorID_fkey` FOREIGN KEY (`MonitorID`) REFERENCES `users`(`UserID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ProgramUsers` ADD CONSTRAINT `ProgramUsers_ProgramID_fkey` FOREIGN KEY (`ProgramID`) REFERENCES `programs`(`ProgramID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramUsers` ADD CONSTRAINT `ProgramUsers_SessionID_fkey` FOREIGN KEY (`SessionID`) REFERENCES `trainingsessions`(`SessionID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramUsers` ADD CONSTRAINT `ProgramUsers_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `users`(`UserID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackResponse` ADD CONSTRAINT `FeedbackResponse_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `users`(`UserID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackResponse` ADD CONSTRAINT `FeedbackResponse_FeedbackID_fkey` FOREIGN KEY (`FeedbackID`) REFERENCES `Feedback`(`FeedbackID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deliverables` ADD CONSTRAINT `deliverables_UserID_fkey` FOREIGN KEY (`UserID`) REFERENCES `users`(`UserID`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `student_deliverables` ADD CONSTRAINT `student_deliverables_deliverable_id_fkey` FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
