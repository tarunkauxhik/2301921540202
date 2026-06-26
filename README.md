# Notification Platform

A notification platform where users receive real-time updates about company
announcements, internal events, and operational results. The repository is split
into a shared logging package, a backend service, and a frontend client. Every
part of the platform reports its activity through the shared logging middleware.

## Structure

| Folder | Description |
|--------|-------------|
| `logging-middleware/` | Reusable TypeScript logging client used by both apps |
| `notification-app-be/` | Express + TypeScript backend service |
| `notification-frontend/` | React + TypeScript + Material UI client |
| `notification-system-design.md` | Design document for stages 1 to 6 |

## Run order

1. Build the logging middleware:
   ```bash
   cd logging-middleware && npm install && npm run build
   ```
2. Start the backend on port 4000:
   ```bash
   cd notification-app-be && npm install && cp .env.example .env   # fill credentials
   npm run dev
   ```
3. Start the frontend on port 3000:
   ```bash
   cd notification-frontend && npm install && cp .env.example .env  # fill credentials
   npm run dev
   ```

The frontend runs at `http://localhost:3000` and talks to the backend at
`http://localhost:4000`.
