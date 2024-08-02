import { IChannelNotification } from "../types/watch-drive.types";
import { GoogleDriveService } from "./google-drive.service";
import { Worker } from "node:worker_threads";

export class WatchDriveService {
  constructor(private googleDriveService: GoogleDriveService) {}
  async execute(data: IChannelNotification) {
    const { payload } = data;

    if (
      payload.changeType === "file" &&
      payload.removed! &&
      payload.kind === "drive#change"
    ) {
      const mimetype = payload.file.name.split(".")[1];
      if (mimetype === "cr3") {
        const parent = await this.googleDriveService.getFileDetails(
          payload.file.id
        );

        if (parent.driveId) {
          const jpegifyWorker = new Worker(
            "../workers/jpegify-pipeline.worker.ts"
          );

          jpegifyWorker.postMessage(
            JSON.stringify({ item: payload.file, driveId: parent.driveId })
          );
        }
      }
    }
  }
}
