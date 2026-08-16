/*
  Warnings:

  - A unique constraint covering the columns `[vin]` on the table `Vehicle` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `engine` ADD COLUMN `code` VARCHAR(191) NULL,
    ADD COLUMN `volume` INTEGER NULL;

-- AlterTable
ALTER TABLE `vehicle` ADD COLUMN `color` VARCHAR(191) NULL,
    ADD COLUMN `currency` VARCHAR(191) NOT NULL DEFAULT 'TRY',
    ADD COLUMN `km` INTEGER NULL,
    ADD COLUMN `price` DOUBLE NULL,
    ADD COLUMN `seats` INTEGER NULL,
    ADD COLUMN `segment` VARCHAR(191) NULL,
    ADD COLUMN `steering` VARCHAR(191) NULL,
    ADD COLUMN `transmission` VARCHAR(191) NULL,
    ADD COLUMN `vin` VARCHAR(191) NULL,
    ADD COLUMN `visible` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX `Vehicle_vin_key` ON `Vehicle`(`vin`);
