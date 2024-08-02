import { drive_v3 } from "googleapis";
import { parentPort } from "node:worker_threads";

interface IDispatcher {
  workers: Record<string, Worker>;
  content: drive_v3.Schema$File[];
}

if (parentPort) {
  parentPort.on("message", (upcomming_msg) => {
    const data: IDispatcher = JSON.parse(upcomming_msg);
    if (data) {
      for (const [label, worker] of Object.entries(data)) {
        const range = label.split("...");
        const [start, end] = [Number(range[0]), Number(range[1])];

        let index = start;
        while (index < end) {
          index++;
          const item = data.content[index];
          worker.postMessage({ item });
        }
      }
    }
  });
}
