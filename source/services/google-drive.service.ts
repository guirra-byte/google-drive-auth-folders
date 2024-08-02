import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import { IJpegify } from "../route";
import { authorize } from "../auth/google-auth";
import fs from "fs";

interface IWatchParams {
  folderId: string;
  resources: {
    channel: string;
    type: string;
    address: string;
  };
}

interface GoogleDrive {
  driveContent: (data: IJpegify) => void;
  getDrive: (driveId: string) => Promise<drive_v3.Schema$Drive>;
  getFileDetails: (fileId: string) => Promise<drive_v3.Schema$File>;
  watch: (params: IWatchParams) => Promise<void>;
  upload: (data: {
    filePath: string;
    fileName: string;
    driveId: string;
    destineLocation: string;
  }) => void;
  download: (data: {
    fileId: string;
    fileName: string;
    destineLocation: string;
  }) => void;
}

class GoogleDriveService implements GoogleDrive {
  private drive: drive_v3.Drive;
  constructor(authenticate: OAuth2Client) {
    this.drive = google.drive({ version: "v3", auth: authenticate });
  }

  async upload(data: {
    filePath: string;
    fileName: string;
    driveId: string;
    destineLocation: string;
  }) {
    const media = {
      mimeType: "application/octet-stream",
      body: fs.createReadStream(data.filePath),
    };

    await this.drive.files.create({
      requestBody: {
        name: data.fileName,
        parents: data.driveId ? [data.driveId] : [],
      },
      media: media,
      fields: "id, name, parents",
    });
  }

  async getDrive(driveId: string): Promise<drive_v3.Schema$Drive> {
    const reply = await this.drive.drives.get({
      driveId,
    });

    return reply.data;
  }

  async getFileDetails(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: "id, name, parents",
      });

      return response.data;
    } catch (error) {
      console.error("Error retrieving file details:", error);
      throw error;
    }
  }

  async watch(params: IWatchParams) {
    await this.drive.files.watch({
      fileId: params.folderId,
      requestBody: {
        id: params.resources.channel,
        type: params.resources.type,
        address: params.resources.address,
      },
    });
  }

  async driveContent(data: IJpegify) {
    const reply = await this.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${data.originLocation}'`,
      fields: "files(id, name)",
    });

    return reply.data.files || [];
  }

  async download(data: {
    fileId: string;
    fileName: string;
    destineLocation: string;
  }): Promise<string> {
    let destine = "";
    this.drive.files
      .get({ fileId: data.fileId, alt: "media" }, { responseType: "stream" })
      .then(async (reply) => {
        if (reply.data) {
          destine = data.destineLocation.concat(`${data.fileName}.jpeg`);
          const destLocation = fs.createWriteStream(destine);
          reply.data.pipe(destLocation);
        }
      });

    return destine;
  }
}

let googleDriveService: GoogleDriveService;
(async () => {
  const auth = await authorize();
  googleDriveService = new GoogleDriveService(auth);
})();

export { GoogleDriveService, googleDriveService };
