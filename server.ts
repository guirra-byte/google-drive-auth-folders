import { app } from "./app";
import { jpegifyRouter } from "./route";

const PORT = 5433;
app.use("/gdrive", jpegifyRouter);
app.listen(PORT, () =>
  console.log(`Server already is running on port ${PORT}`)
);
