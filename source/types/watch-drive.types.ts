interface IFileDetails {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

interface IPayload {
  kind: string;
  changeType: string;
  time: string;
  removed: boolean;
  fileId: string;
  file: IFileDetails;
}

interface IChannelNotification {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: string;
  type: string;
  address: string;
  payload: IPayload;
}

export { IFileDetails, IPayload, IChannelNotification };
