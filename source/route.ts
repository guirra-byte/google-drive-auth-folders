import { Request, Response, Router } from "express";
import { googleDriveService } from "./services/google-drive.service";
import { JpegifyService } from "./services/jpegify.service";
const jpegifyRouter = Router();

export interface IJpegify {
  requester: {
    name: string;
    email: string;
  };
  originLocation: string;
}

jpegifyRouter.post(
  "/webhook/2jpeg",
  async (request: Request, response: Response) => {
    const data: IJpegify = request.body;
    if (data) {
      const dispatchToJpegifyService = new JpegifyService(googleDriveService);
      await dispatchToJpegifyService.execute(data);
    }

    return response.end();
  }
);

export { jpegifyRouter };
