export interface Notification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

export interface PriorityNotification extends Notification {
  score: number;
}

export type NotificationType = "Event" | "Result" | "General" | "Placement";
