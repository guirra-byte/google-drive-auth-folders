import path from "node:path";

const authDirPath = path.resolve(__dirname, "../auth");
const localDestination = path.resolve(__dirname, "../../tmp");
const jpegifyWorkerPath = path.resolve(__dirname, "../jpegify-pipe.worker.ts");

export { authDirPath, localDestination, jpegifyWorkerPath };
