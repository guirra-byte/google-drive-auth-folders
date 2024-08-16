import { OAuth2Client } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import { injectable } from "tsyringe";
import fs from "fs";
import { IJpegify } from "../jpegify-pipe.worker";

interface IWatchParams {
  driveId: string;
  resources: {
    channel_id: string;
    type: string;
    notification_address: string;
  };
}

interface GoogleDrive {
  driveContent: (data: IJpegify) => void;
  getDrive: (driveId: string) => Promise<drive_v3.Schema$Drive>;
  getFileDetails: (fileId: string) => Promise<drive_v3.Schema$File>;
  watch: (params: IWatchParams) => Promise<void>;
  delete: (fileId: string) => Promise<void>;
  upload: (data: {
    filePath: string;
    fileName: string;
    driveId: string;
    destineLocation: string;
    previousFile: {
      filename: string;
      id: string;
      delete: boolean;
    };
  }) => void;
  download: (data: {
    fileId: string;
    fileName: string;
    destineLocation: string;
  }) => void;
}

@injectable()
class GoogleDriveService implements GoogleDrive {
  private authenticated: boolean = false;
  private drive: drive_v3.Drive;

  get _drive() {
    return this.drive;
  }

  async authenticate(oAuthClient: OAuth2Client) {
    this.drive = google.drive({ version: "v3", auth: oAuthClient });
    this.authenticated = true;
  }

  async isAuthenticated() {
    return this.authenticated;
  }

  async upload(data: {
    filePath: string;
    fileName: string;
    driveId: string;
    destineLocation: string;
    previousFile: {
      filename: string;
      id: string;
      delete: boolean;
    };
  }) {
    const media = {
      mimeType: "image/x-canon-cr3",
      body: fs.createReadStream(data.filePath),
    };

    const splitMimetype = (filename: string, pattern: string) => {
      return filename.split(pattern);
    };

    const [previousFileName, previousFileMimetype] = splitMimetype(
      data.previousFile.filename,
      "."
    );

    await this.drive.files
      .create({
        requestBody: {
          name: data.fileName,
          parents: data.driveId ? [data.driveId] : [],
        },
        media: media,
        fields: "id, name, parents",
      })
      .then(async (reply) => {
        if (data.previousFile.delete) {
          if (reply.data.name) {
            const [createdFileName, createdFileMimetype] = splitMimetype(
              reply.data.name,
              "."
            );

            if (
              createdFileName === previousFileName &&
              previousFileMimetype === "cr3" &&
              createdFileMimetype === "jpeg"
            ) {
              await this.delete(data.previousFile.id);
            }
          }
        }
      });
  }

  async delete(fileId: string) {
    await this.drive.files.delete({ fileId });
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
    await this.drive.changes.watch({
      driveId: params.driveId,
      requestBody: {
        id: params.resources.channel_id,
        type: params.resources.type,
        address: params.resources.notification_address,
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

export { GoogleDriveService };
