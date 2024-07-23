import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import { IJpegify } from "../route";
import sharp from "sharp";
import fs from "fs";

interface GoogleDrive {
  driveContent: (data: IJpegify) => void;
  upload: (data: { destineLocation: string; filePath: string }) => void;
  download: (data: {
    fileId: string;
    fileName: string;
    newName: string;
    destineLocation: string;
  }) => void;
}

class GoogleDriveService implements GoogleDrive {
  private drive: drive_v3.Drive;
  constructor(authenticate: OAuth2Client) {
    this.drive = google.drive({ version: "v3", auth: authenticate });
  }

  async driveContent(data: IJpegify) {
    const reply = await this.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${data.originLocation}'`,
      fields: "files(id, name)",
    });

    return reply.data.files || [];
  }

  async upload(data: { destineLocation: string; filePath: string }) {}

  async download(data: {
    fileId: string;
    fileName: string;
    newName: string;
    destineLocation: string;
  }): Promise<string> {
    let destine = "";
    this.drive.files
      .get({ fileId: data.fileId, alt: "media" }, { responseType: "stream" })
      .then(async (reply) => {
        if (reply.data) {
          destine = `${data.newName}.jpeg`;
          const destLocation = fs.createWriteStream(destine);
          reply.data.pipe(destLocation);
        }
      });

    return destine;
  }
}

const googleDriveService = new GoogleDriveService();
export { GoogleDriveService, googleDriveService };
