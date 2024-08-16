import { google } from "googleapis";
import { OAuth2Client, Credentials } from "google-auth-library";
import { authDirPath } from "../config/path.config";
import readline from "readline";
import { IGoogleUserSecrets } from "../jpegify-pipe.worker";
import * as fs from "fs";
import jwt from "jsonwebtoken";

interface ISharedGoogleAuth {
  credentials: Credentials;
  client: { client_id: string; client_secret: string; redirect_uris: string[] };
}

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const TOKEN_PATH = authDirPath.concat("/access_token.json");

async function shareAuth(oAuthCredentials: ISharedGoogleAuth) {
  const payload = { ...oAuthCredentials };
  const secretKey = process.env.SHARED_GOOGLE_AUTH_SECRET_KEY;

  if (secretKey) {
    const sharedAuth = jwt.sign(payload, secretKey, { expiresIn: "1h" });
    await axios.post("http://localhost:3000/shared-google-auth", {
      shared_auth: sharedAuth,
    });
  }
}

async function oAuth2GetClient() {
  const credentialsFilepath = authDirPath.concat(
    "/client_secret_201426273566-qrkflliodr4mdc0a0nlvf8lbfd2gucs9.apps.googleusercontent.com.json"
  );

  const credentials: IGoogleUserSecrets = JSON.parse(
    fs.readFileSync(credentialsFilepath, "utf8")
  );

  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  return {
    client: oAuth2Client,
    params: { client_secret, client_id, redirect_uris },
  };
}

export async function authorize(): Promise<OAuth2Client> {
  const oAuth2Client = await oAuth2GetClient();
  const { client, params } = oAuth2Client;

  try {
    const token = fs.readFileSync(TOKEN_PATH, "utf8");
    const parsedToken: Credentials = JSON.parse(token);

    client.setCredentials(parsedToken);
    await shareAuth({
      credentials: parsedToken,
      client: {
        client_id: params.client_id,
        client_secret: params.client_secret,
        redirect_uris: params.redirect_uris,
      },
    });

    return client;
  } catch (err) {
    return getNewToken(client);
  }
}

function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this url:", authUrl);

  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      "Por favor, insira o token de autorização do Google: ",
      (token) => {
        rl.close();
        oAuth2Client.getToken(token, async (err, tokenCredentials) => {
          if (err) return reject(err);

          if (tokenCredentials) {
            oAuth2Client.setCredentials(tokenCredentials!);
            const { params } = await oAuth2GetClient();
            await shareAuth({
              credentials: tokenCredentials,
              client: params,
            });

            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenCredentials));
            console.log("Token stored to", TOKEN_PATH);
            resolve(oAuth2Client);
          } else reject();
        });
      }
    );
  });
}
