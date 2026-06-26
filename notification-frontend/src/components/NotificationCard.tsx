import CircleIcon from "@mui/icons-material/Circle";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { TYPE_COLORS } from "../theme";
import { Notification } from "../types";

interface Props {
  notification: Notification;
  isNew: boolean;
  onView: (id: string) => void;
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}

export function NotificationCard({ notification, isNew, onView }: Props) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: isNew ? "4px solid" : "4px solid transparent",
        borderLeftColor: isNew ? "primary.main" : "transparent",
        backgroundColor: isNew ? "#ffffff" : "#fafafa",
      }}
    >
      <CardActionArea onClick={() => onView(notification.ID)} sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={notification.Type}
              color={TYPE_COLORS[notification.Type] ?? "default"}
              size="small"
            />
            {isNew && (
              <Chip
                icon={<CircleIcon sx={{ fontSize: 10 }} />}
                label="New"
                color="error"
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
          {typeof notification.score === "number" && (
            <Typography variant="caption" color="text.secondary">
              score {notification.score.toFixed(2)}
            </Typography>
          )}
        </Stack>
        <Box mt={1.5}>
          <Typography variant="body1" sx={{ fontWeight: isNew ? 600 : 400 }}>
            {notification.Message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTimestamp(notification.Timestamp)}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}
