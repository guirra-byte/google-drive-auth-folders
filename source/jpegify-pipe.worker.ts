import { parentPort } from "node:worker_threads";
import { GoogleDriveService } from "./services/google-drive.service";
import sharp from "sharp";
import fs from "node:fs";
import { IFileDetails } from "./types/watch-drive.types";
import { container } from "tsyringe";

export interface IJpegify {
  requester: {
    name: string;
    email: string;
  };
  originLocation: string;
  deletePreviousFile: boolean;
}

export interface IGoogleUserSecrets {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export interface IGoogleAccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string[];
  token_type: string;
}

export interface IJpegifyParams {
  item: IFileDetails;
  driveId: string;
}

if (parentPort) {
  parentPort.on("message", async (upcomming_msg) => {
    const googleDriveService = container.resolve(GoogleDriveService);
    const payload: { data: IJpegifyParams; key: string }[] =
      JSON.parse(upcomming_msg);

    if (payload) {
      for (const params of payload) {
        const { data, key } = params;
        if (data.item.id && data.item.name) {
          const destineLocation = await googleDriveService.getDrive(
            data.driveId
          );

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

            const fileOut = `${localDestination}/${outJpegFile}`;
            fs.readFile(toJpeg, async (error, toJpeg) => {
              if (error) throw error;
              await sharp(toJpeg).jpeg().toFile(fileOut);
            });

            const destineDrive = `${destineLocation.name}`;
            await googleDriveService
              .upload({
                filePath: outJpegFile,
                driveId: data.driveId,
                fileName: `${outJpegFile}.jpeg`,
                destineLocation: destineDrive,
                previousFile: {
                  filename: data.item.name,
                  id: data.item.id,
                  delete: false,
                },
              })
              .then(() => {
                parentPort?.postMessage(key);
                fs.rm(fileOut, (error) => {
                  if (error) throw error;
                });
              });
          }
        }
      }
    }
  });
}
