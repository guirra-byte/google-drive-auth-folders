import { Request, Response, Router } from "express";
import { GoogleDriveService } from "./services/google-drive.service";
import { container } from "tsyringe";
import { authorize } from "./auth/google-auth";
import axios from "axios";
import { GoogleDriveRepository } from "./shared/repository/google-drive.repository";
import { OAuth2Client } from "google-auth-library";

export interface IJpegify {
  requester: {
    name: string;
    email: string;
  };
  originLocation: string;
  deletePreviousFile: boolean;
}

const jpegifyRouter = Router();
const googleDriveService = container.resolve(GoogleDriveService);
const googleDriveRepository = container.resolve(GoogleDriveRepository);

jpegifyRouter.post(
  "/authorize",
  async (request: Request, response: Response) => {}
);

jpegifyRouter.post("/create-folder", async (request:) => {
  const data: IJpegify = request.body;
  const drive = googleDriveService._drive;
  const subFolder = async (parentFolderId: string, folderName: string, auth: OAuth2Client) => {
    try {
      const reply = await drive.files.create({
        auth: auth,
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentFolderId],
        },
        fields: "id, name",
      });

      const folder = reply.data;
      console.log(`Folder '${folderName}' created with ID: ${folder.id}`);
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  if (data) {
    const auth = await authorize();
    await googleDriveService.authenticate(auth);

    const verifyFolderCreation = await googleDriveRepository.isFolderCreated(
      data.originLocation
    );

    if (!verifyFolderCreation) {
      const fileMetadata = {
        name: data.originLocation,
        mimeType: "application/vnd.google-apps.folder",
      };

      const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id",
      });

      if (
        folder.data.id &&
        folder.data.driveId &&
        folder.data.name &&
        folder.data.name === data.originLocation
      ) {
        await Promise.all([
          subFolder(folder.data.id, "CR3", auth),
          subFolder(folder.data.id, "JPEG", auth),
        ]);

        await googleDriveRepository.createFolder({
          id: folder.data.id,
          name: folder.data.name,
          parentDriveId: folder.data.driveId,
        });
      }
    }
  }
});

// Nest.Js App Presigned URLs Route;
const nestApplicationBaseUrl = "http://localhost:3000";
jpegifyRouter.post(
  "/presign-url",
  async (request: Request, response: Response) => {
    const rsrc = request.originalUrl;
    const nestServiceUrl = `${nestApplicationBaseUrl}/${rsrc}`;
    const appBaseUrl = process.env.APP_BASE_URL;

    const data: IJpegify = request.body;
    const foldersCreation = async () => {
      const verifyFolderCreation = await googleDriveRepository.isFolderCreated(
      data.originLocation
    );

    if (verifyFolderCreation) {
      const reply = await axios.post(nestServiceUrl, 
        { ...data, folderId: verifyFolderCreation.folderId });
      const { presignedUrl } = reply.data as { presignedUrl: string };

      return response.status(202).send({ presignedUrl });
    }

    if(!verifyFolderCreation){
      await axios.post(`${appBaseUrl}/gdrive/create-folder`, { data })
      .then(() => foldersCreation());
    }}
  }
);

export { jpegifyRouter };
