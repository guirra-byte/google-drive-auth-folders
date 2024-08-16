import { GoogleDriveService } from "./google-drive.service";
import { Worker } from "node:worker_threads";
import { IJpegify, IJpegifyParams } from "../jpegify-pipe.worker";
import { jpegifyWorkerPath } from "../config/path.config";

export class JpegifyService {
  constructor(private googleDriveService: GoogleDriveService) {}
  async execute(data: IJpegify) {
    const content = await this.googleDriveService.driveContent(data);

    const batchSize = Math.round(Math.ceil(content.length / 10));
    const agroupBatchs: Record<string, IJpegifyParams[]> = {};
    content.forEach((item, index) => {
      let key = 0;
      if (index % batchSize === 0) {
        key = key + index;
      }

      const { id, name, mimeType, modifiedTime, driveId } = item;
      if (id && name && mimeType && modifiedTime && driveId) {
        const payload = {
          item: {
            id,
            name,
            mimeType,
            modifiedTime,
          },
          driveId,
        };

        if (agroupBatchs[`${key}`]) {
          agroupBatchs[`${key}`].push(payload);
        } else agroupBatchs[`${key}`] = [payload];
      }
    });

    const jpegifyWorker = new Worker(jpegifyWorkerPath);

    const initialKey = "0";
    const currentBatch = Buffer.from(
      JSON.stringify({ key: initialKey, data: agroupBatchs[initialKey] })
    );

    jpegifyWorker.on("message", (backcomming_data) => {
      const nxtKey = Number(backcomming_data) + 1;
      if (agroupBatchs[`${nxtKey}`]) {
        const buffer = Buffer.from(
          JSON.stringify({ key: initialKey, data: agroupBatchs[nxtKey] })
        );

        jpegifyWorker.postMessage(buffer);
      }
    });

    jpegifyWorker.postMessage(currentBatch);
  }
}

// Paginação com workers;
// Definir quantos itens possuem dentro da pasta;
// Criação dos workers e atribuição de ranges;
// Workers são responsáveis por paginar de acordo com o range que recebem;
