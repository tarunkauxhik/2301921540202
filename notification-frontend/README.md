# Notification Frontend

React + TypeScript + Material UI client for the notification platform. It runs on
`http://localhost:3000` and talks to the backend service.

## Setup

```bash
npm install
cp .env.example .env
```

Fill the `VITE_AUTH_*` values in `.env`, make sure the backend is running on
port 4000, then:

```bash
npm run dev
```

## Features

- Two views: **All** notifications (paginated) and the **Priority Inbox**.
- Filter by notification type (Event, Result, General, Placement).
- New notifications are highlighted and counted; viewed ones are remembered.
- Loading, empty, and error states with retry.
- Every action is reported through the shared logging middleware.
