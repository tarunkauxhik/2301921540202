import {
  AuthCredentials,
  Level,
  LoggerOptions,
  LogPackage,
  Stack,
} from "./types";

const VALID_STACKS: Stack[] = ["backend", "frontend"];

const VALID_LEVELS: Level[] = ["debug", "info", "warn", "error", "fatal"];

const VALID_PACKAGES: LogPackage[] = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
];

interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

let options: LoggerOptions | null = null;
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export function configureLogger(opts: LoggerOptions): void {
  options = opts;
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function getToken(): Promise<string> {
  if (!options) {
    throw new Error("Logger is not configured. Call configureLogger() first.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedToken && nowSeconds < tokenExpiresAt - 30) {
    return cachedToken;
  }

  const response = await fetch(`${options.baseUrl}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options.credentials),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed with status ${response.status}`);
  }

  const data = (await response.json()) as AuthResponse;
  cachedToken = data.access_token;
  tokenExpiresAt = data.expires_in;
  return cachedToken;
}

export async function Log(
  stack: Stack,
  level: Level,
  pkg: LogPackage,
  message: string
): Promise<void> {
  if (!VALID_STACKS.includes(stack)) {
    throw new Error(`Invalid stack: ${stack}`);
  }
  if (!VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid level: ${level}`);
  }
  if (!VALID_PACKAGES.includes(pkg)) {
    throw new Error(`Invalid package: ${pkg}`);
  }

  if (!options) {
    return;
  }

  try {
    const token = await getToken();
    await fetch(`${options.baseUrl}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });
  } catch {
    return;
  }
}

export type { AuthCredentials, Level, LoggerOptions, LogPackage, Stack };
