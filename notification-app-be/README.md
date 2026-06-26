# Notification App Backend

Express + TypeScript service for the notification platform. It wraps the
evaluation reference API, builds the priority inbox, and reports every event
through the shared logging middleware.

## Setup

```bash
npm install
cp .env.example .env
```

Fill the `AUTH_*` values in `.env` with your evaluation credentials, then:

```bash
npm run dev      # development with reload
npm run build    # compile to dist
npm start        # run compiled build
```

The server runs on `http://localhost:4000`.

## Endpoints

| Method | Path | Query | Description |
|--------|------|-------|-------------|
| GET | `/health` | - | Service health check |
| GET | `/api/notifications` | `limit` (5-10), `page`, `notification_type` | List notifications |
| GET | `/api/notifications/priority` | `n`, `notification_type` | Top `n` priority notifications |

## Priority model

Each notification is scored as `typeWeight + recencyScore`.

- Type weights: `Result` 5, `Placement` 4, `Event` 3, `General` 2, others 1.
- Recency uses exponential decay with a 12 hour half life, so newer items rank
  higher and break ties between equal types.
