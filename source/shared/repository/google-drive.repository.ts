import { injectable } from "tsyringe";
import { client } from "../prisma/index.prisma";
import { nanoid } from "nanoid";

interface ICreateGoogleDriveFolder {
  id: string;
  name: string;
  parentDriveId: string;
}

interface IGoogleDriveRepository {
  isFolderCreated: (name: string) => any;
  createFolder: (data: ICreateGoogleDriveFolder) => void;
}

@injectable()
export class GoogleDriveRepository implements IGoogleDriveRepository {
  private prismaClient = client
  constructor() {}

  async isFolderCreated(name: string) {
    const verifyFolderCreation =
      await this.prismaClient.googleDriveFolder.findUnique({
        where: { name },
      });

    return verifyFolderCreation;
  }

  async createFolder(data: ICreateGoogleDriveFolder) {
    await this.prismaClient.googleDriveFolder.create({
      data: {
        name: data.name,
        folderId: data.id,
        id: nanoid(),
        parentDriveId: data.parentDriveId,
      },
    });
  }
}
