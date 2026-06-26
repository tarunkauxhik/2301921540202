export interface Notification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
  score?: number;
}

export type FilterType = "All" | "Event" | "Result" | "General" | "Placement";

export type ViewMode = "all" | "priority";
