-- CreateTable
CREATE TABLE "google_drive_folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_drive_folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_drive_folder_name_key" ON "google_drive_folder"("name");

-- CreateIndex
CREATE UNIQUE INDEX "google_drive_folder_folder_id_key" ON "google_drive_folder"("folder_id");
