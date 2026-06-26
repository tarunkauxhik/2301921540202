import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "viewed-notifications";

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function useViewed() {
  const [viewed, setViewed] = useState<Set<string>>(() => readStored());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...viewed]));
  }, [viewed]);

  const markViewed = useCallback((id: string) => {
    setViewed((current) => {
      if (current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const markAllViewed = useCallback((ids: string[]) => {
    setViewed((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  return { viewed, markViewed, markAllViewed };
}
