import { config } from "../config";
import { Log } from "../logging";

interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getAccessToken(): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedToken && nowSeconds < tokenExpiresAt - 30) {
    return cachedToken;
  }

  const response = await fetch(`${config.baseUrl}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.credentials),
  });

  if (!response.ok) {
    await Log("backend", "error", "auth", `token request failed (${response.status})`);
    throw new Error(`Authentication failed with status ${response.status}`);
  }

  const data = (await response.json()) as AuthResponse;
  cachedToken = data.access_token;
  tokenExpiresAt = data.expires_in;
  await Log("backend", "info", "auth", "access token refreshed");
  return cachedToken;
}
