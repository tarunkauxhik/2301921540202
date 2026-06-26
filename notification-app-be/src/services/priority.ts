import { Notification, PriorityNotification } from "../types/notification";

const TYPE_WEIGHTS: Record<string, number> = {
  Result: 5,
  Placement: 4,
  Event: 3,
  General: 2,
};

const DEFAULT_WEIGHT = 1;
const RECENCY_HALF_LIFE_HOURS = 12;

function typeWeight(type: string): number {
  return TYPE_WEIGHTS[type] ?? DEFAULT_WEIGHT;
}

function recencyScore(timestamp: string, now: number): number {
  const parsed = Date.parse(timestamp.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed)) {
    return 0;
  }
  const ageHours = Math.max(0, (now - parsed) / (1000 * 60 * 60));
  return Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
}

export function scoreNotification(
  notification: Notification,
  now: number
): PriorityNotification {
  const score =
    typeWeight(notification.Type) + recencyScore(notification.Timestamp, now);
  return { ...notification, score: Number(score.toFixed(4)) };
}

export function getTopPriority(
  notifications: Notification[],
  limit: number
): PriorityNotification[] {
  const now = Date.now();
  return notifications
    .map((item) => scoreNotification(item, now))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
