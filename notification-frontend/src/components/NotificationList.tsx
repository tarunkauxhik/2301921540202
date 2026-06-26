import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Notification } from "../types";
import { NotificationCard } from "./NotificationCard";

interface Props {
  items: Notification[];
  loading: boolean;
  error: string | null;
  viewed: Set<string>;
  onView: (id: string) => void;
  onRetry: () => void;
}

export function NotificationList({ items, loading, error, viewed, onView, onRetry }: Props) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (items.length === 0) {
    return (
      <Typography align="center" color="text.secondary" py={6}>
        No notifications to show.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {items.map((item) => (
        <NotificationCard
          key={item.ID}
          notification={item}
          isNew={!viewed.has(item.ID)}
          onView={onView}
        />
      ))}
    </Stack>
  );
}
