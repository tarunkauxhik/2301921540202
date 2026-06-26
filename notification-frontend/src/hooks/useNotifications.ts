import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getPriorityNotifications,
} from "../api/notifications";
import { Log } from "../logging";
import { FilterType, Notification, ViewMode } from "../types";

const PAGE_SIZE = 10;
const PRIORITY_COUNT = 10;

interface State {
  items: Notification[];
  loading: boolean;
  error: string | null;
}

export function useNotifications(mode: ViewMode, filter: FilterType, page: number) {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const items =
        mode === "priority"
          ? await getPriorityNotifications(PRIORITY_COUNT, filter)
          : await getNotifications({ limit: PAGE_SIZE, page, notificationType: filter });
      await Log("frontend", "info", "hook", `loaded ${items.length} ${mode} notifications`);
      setState({ items, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      await Log("frontend", "error", "hook", message);
      setState({ items: [], loading: false, error: message });
    }
  }, [mode, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
