import "reflect-metadata";
import { app } from "./shared/app";
import { jpegifyRouter } from "./route";
import express from "express";

const PORT = 5433;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/gdrive", jpegifyRouter);
app.listen(PORT, () =>
  console.log(`Server already is running on port ${PORT}`)
);
