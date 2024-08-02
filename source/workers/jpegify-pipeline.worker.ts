import { drive_v3 } from "googleapis";
import { parentPort } from "node:worker_threads";
import { googleDriveService } from "../services/google-drive.service";
import sharp from "sharp";
import fs from "node:fs";
import { IFileDetails } from "../types/watch-drive.types";

interface IJpegifyParams {
  item: IFileDetails;
  driveId: string;
}

if (parentPort) {
  parentPort.on("message", async (upcomming_msg) => {
    const data: IJpegifyParams = JSON.parse(upcomming_msg);

    if (data) {
      if (data.item.id && data.item.name) {
        const destineLocation = await googleDriveService.getDrive(data.driveId);

        const localDestination = `src/tmp/${destineLocation.name}`;
        const existsDir = fs.existsSync(localDestination);
        if (!existsDir) {
          fs.mkdir(localDestination, (err) => {
            if (err) throw err;
          });
        }

        const toJpeg = await googleDriveService.download({
          fileId: data.item.id,
          fileName: data.item.name,
          destineLocation: localDestination,
        });

        if (toJpeg !== "") {
          let [outJpegFile] = data.item.name.split(".");
          outJpegFile = `${outJpegFile}.jpeg`;
          
          await sharp(toJpeg)
            .jpeg()
            .toFile(`${localDestination}/${outJpegFile}`);

          const destineDrive = `${destineLocation.name}`;
          await googleDriveService.upload({
            filePath: outJpegFile,
            driveId: data.driveId,
            fileName: `${outJpegFile}.jpeg`,
            destineLocation: destineDrive,
          });
        }
      }
    }
  });
}
