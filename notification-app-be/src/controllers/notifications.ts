import { Request, Response } from "express";
import { config } from "../config";
import { Log } from "../logging";
import {
  collectNotifications,
  fetchNotifications,
} from "../services/notifications";
import { getTopPriority } from "../services/priority";

const ALLOWED_TYPES = ["Event", "Result", "General", "Placement"];

function parseType(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  if (!ALLOWED_TYPES.includes(value)) {
    return undefined;
  }
  return value;
}

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 5), 10);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const notificationType = parseType(req.query.notification_type);

  try {
    const notifications = await fetchNotifications({ limit, page, notificationType });
    await Log("backend", "info", "controller", `served ${notifications.length} notifications`);
    res.json({ page, limit, notification_type: notificationType ?? null, notifications });
  } catch (error) {
    await Log("backend", "error", "controller", "failed to list notifications");
    res.status(502).json({ message: "Unable to fetch notifications" });
  }
}

export async function listPriority(req: Request, res: Response): Promise<void> {
  const n = Math.min(Math.max(Number(req.query.n) || 10, 1), 50);
  const notificationType = parseType(req.query.notification_type);

  try {
    const pool = await collectNotifications(config.priorityPageDepth, notificationType);
    const top = getTopPriority(pool, n);
    await Log("backend", "info", "controller", `served top ${top.length} priority notifications`);
    res.json({ n, notification_type: notificationType ?? null, notifications: top });
  } catch (error) {
    await Log("backend", "error", "controller", "failed to build priority inbox");
    res.status(502).json({ message: "Unable to build priority inbox" });
  }
}
