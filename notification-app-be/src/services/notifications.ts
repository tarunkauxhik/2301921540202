import { config } from "../config";
import { Log } from "../logging";
import { Notification } from "../types/notification";
import { getAccessToken } from "./auth";

interface NotificationsResponse {
  notifications: Notification[];
}

interface FetchParams {
  limit: number;
  page: number;
  notificationType?: string;
}

export async function fetchNotifications(
  params: FetchParams
): Promise<Notification[]> {
  const token = await getAccessToken();
  const query = new URLSearchParams({
    limit: String(params.limit),
    page: String(params.page),
  });
  if (params.notificationType) {
    query.set("notification_type", params.notificationType);
  }

  const response = await fetch(
    `${config.baseUrl}/notifications?${query.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    await Log(
      "backend",
      "error",
      "service",
      `notifications fetch failed (${response.status})`
    );
    throw new Error(`Reference API responded with status ${response.status}`);
  }

  const data = (await response.json()) as NotificationsResponse;
  return data.notifications ?? [];
}

export async function collectNotifications(
  pageDepth: number,
  notificationType?: string
): Promise<Notification[]> {
  const seen = new Set<string>();
  const collected: Notification[] = [];

  for (let page = 1; page <= pageDepth; page += 1) {
    const batch = await fetchNotifications({
      limit: 10,
      page,
      notificationType,
    });
    if (batch.length === 0) {
      break;
    }
    for (const item of batch) {
      if (!seen.has(item.ID)) {
        seen.add(item.ID);
        collected.push(item);
      }
    }
  }

  await Log(
    "backend",
    "info",
    "service",
    `collected ${collected.length} notifications across ${pageDepth} pages`
  );
  return collected;
}
