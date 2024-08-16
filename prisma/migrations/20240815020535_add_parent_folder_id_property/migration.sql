/*
  Warnings:

  - Added the required column `parent_drive_id` to the `google_drive_folder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "google_drive_folder" ADD COLUMN     "parent_drive_id" TEXT NOT NULL;
