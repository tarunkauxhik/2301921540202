"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureLogger = configureLogger;
exports.Log = Log;
const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = [
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
let options = null;
let cachedToken = null;
let tokenExpiresAt = 0;
function configureLogger(opts) {
    options = opts;
    cachedToken = null;
    tokenExpiresAt = 0;
}
async function getToken() {
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
    const data = (await response.json());
    cachedToken = data.access_token;
    tokenExpiresAt = data.expires_in;
    return cachedToken;
}
async function Log(stack, level, pkg, message) {
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
    }
    catch {
        return;
    }
}
