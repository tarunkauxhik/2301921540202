# Logging Middleware

A small, reusable client for sending structured logs to the evaluation log service.
It is shared by both the backend and the frontend so every part of the platform
reports its events the same way.

## What it does

- Exposes a single `Log(stack, level, package, message)` function.
- Handles authentication on its own: it requests a token, caches it, and
  refreshes it automatically once the short-lived token is about to expire.
- Validates the `stack`, `level`, and `package` values before sending.
- Never throws because of a network problem, so logging can never crash the app.

## Setup

```bash
npm install
npm run build
```

## Usage

```ts
import { Log, configureLogger } from "logging-middleware";

configureLogger({
  baseUrl: "http://4.224.186.213/evaluation-service",
  credentials: {
    email: "...",
    name: "...",
    rollNo: "...",
    accessCode: "...",
    clientID: "...",
    clientSecret: "...",
  },
});

await Log("backend", "info", "service", "server started on port 4000");
```

## Allowed values

- **stack:** `backend`, `frontend`
- **level:** `debug`, `info`, `warn`, `error`, `fatal`
- **package (backend):** `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`
- **package (frontend):** `api`, `component`, `hook`, `page`, `state`, `style`
- **package (shared):** `auth`, `config`, `middleware`, `utils`
