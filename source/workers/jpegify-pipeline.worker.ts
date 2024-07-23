import { drive_v3 } from "googleapis";
import { parentPort } from "node:worker_threads";
import { googleDriveService } from "../services/google-drive.service";
import sharp from "sharp";
import fs from "node:fs";

if (parentPort) {
  parentPort.on("message", async (upcomming_msg) => {
    const data: {
      item: drive_v3.Schema$File;
      index: number;
      end: number;
      driveId: string;
    } = JSON.parse(upcomming_msg);

    if (data) {
      if (data.item.id && data.item.originalFilename && data.item.name) {
        const destineLocation = await googleDriveService.getDrive(data.driveId);

        const localDestination = `src/${destineLocation.name}`;
        const existsDir = fs.existsSync(`src/${localDestination}`);
        if (!existsDir) {
          fs.mkdir(localDestination, (err) => {
            if (err) throw err;
          });
        }

        const toJpeg = await googleDriveService.download({
          fileId: data.item.id,
          fileName: data.item.originalFilename,
          newName: data.item.name,
          destineLocation: localDestination,
        });

        if (data.index === data.end - 1) {
          if (toJpeg !== "") {
            await sharp(toJpeg).jpeg().toFile(toJpeg);
          }

          const destineDrive = `${destineLocation.name} - JPEG`;
          await googleDriveService.upload({
            filePath: toJpeg,
            driveId: data.driveId,
            fileName: data.item.name,
            destineLocation: destineDrive,
          });
        }
      }
    }
  });
}
