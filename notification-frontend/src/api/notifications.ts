import { Log } from "../logging";
import { Notification } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

interface ListParams {
  limit: number;
  page: number;
  notificationType?: string;
}

interface ListResponse {
  notifications: Notification[];
}

export async function getNotifications(params: ListParams): Promise<Notification[]> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    page: String(params.page),
  });
  if (params.notificationType && params.notificationType !== "All") {
    query.set("notification_type", params.notificationType);
  }

  const response = await fetch(`${BASE_URL}/notifications?${query.toString()}`);
  if (!response.ok) {
    await Log("frontend", "error", "api", `notifications request failed (${response.status})`);
    throw new Error("Failed to load notifications");
  }

  const data = (await response.json()) as ListResponse;
  return data.notifications;
}

export async function getPriorityNotifications(
  n: number,
  notificationType?: string
): Promise<Notification[]> {
  const query = new URLSearchParams({ n: String(n) });
  if (notificationType && notificationType !== "All") {
    query.set("notification_type", notificationType);
  }

  const response = await fetch(`${BASE_URL}/notifications/priority?${query.toString()}`);
  if (!response.ok) {
    await Log("frontend", "error", "api", `priority request failed (${response.status})`);
    throw new Error("Failed to load priority notifications");
  }

  const data = (await response.json()) as ListResponse;
  return data.notifications;
}
