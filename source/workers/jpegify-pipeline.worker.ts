import { drive_v3 } from "googleapis";
import { parentPort } from "node:worker_threads";
import { googleDriveService } from "../services/google-drive.service";
import sharp from "sharp";

if (parentPort) {
  parentPort.on("message", async (upcomming_msg) => {
    const data: { item: drive_v3.Schema$File; index: number; end: number } =
      JSON.parse(upcomming_msg);

    if (data) {
      if (data.item.id && data.item.originalFilename && data.item.name) {
        const toJpeg = await googleDriveService.download({
          fileId: data.item.id,
          fileName: data.item.originalFilename,
          newName: data.item.name,
          destineLocation: "",
        });

        if (data.index === data.end - 1) {
          if (toJpeg !== "") {
            await sharp(toJpeg).jpeg().toFile(toJpeg);
          }
          //upload in new folder
        }
      }
    }
  });
}
