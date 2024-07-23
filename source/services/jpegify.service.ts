import { IJpegify } from "../route";
import { GoogleDriveService } from "./google-drive.service";
import { Worker } from "node:worker_threads";

export class JpegifyService {
  constructor(private googleDriveService: GoogleDriveService) {}
  async execute(data: IJpegify) {
    const jpegifyWorkers: Record<string, Worker> = {};
    const content = await this.googleDriveService.driveContent(data);

    const itens = 30;
    const workers = Math.floor(content.length * (itens / 100));
    for (let item = 0; item <= workers; item += itens) {
      const range = { start: item, end: item + itens };
      const label = `${range.start}...${range.end}`;

      if (!jpegifyWorkers[label]) {
        jpegifyWorkers[label] = new Worker("../workers/jpegify.worker.ts");
      }
    }

    const dispatcherWorker = new Worker("../workers/dispatcher.worker.ts");
    dispatcherWorker.postMessage(
      JSON.stringify({ workers: jpegifyWorkers, content })
    );
  }
}

// Paginação com workers;
// Definir quantos itens possuem dentro da pasta;
// Criação dos workers e atribuição de ranges;
// Workers são responsáveis por paginar de acordo com o range que recebem;
