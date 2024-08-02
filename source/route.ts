import { Request, Response, Router } from "express";
import { googleDriveService } from "./services/google-drive.service";
import { JpegifyService } from "./services/jpegify.service";
import { IChannelNotification } from "./types/watch-drive.types";
import { WatchDriveService } from "./services/watch-drive.service";
const jpegifyRouter = Router();

export interface IJpegify {
  requester: {
    name: string;
    email: string;
  };
  originLocation: string;
}

jpegifyRouter.get(
  "/webhook/2jpeg",
  async (request: Request, response: Response) => {
    const data: IChannelNotification = request.body;
    if (data) {
      const watchDriveService = new WatchDriveService();
      await watchDriveService.execute(data);
    }

    return response.send();
  }
);

jpegifyRouter.post("/2jpeg", async (request: Request, response: Response) => {
  const data: IJpegify = request.body;
  if (data) {
    const dispatchToJpegifyService = new JpegifyService(googleDriveService);
    await dispatchToJpegifyService.execute(data);
  }

  return response.send();
});

export { jpegifyRouter };
