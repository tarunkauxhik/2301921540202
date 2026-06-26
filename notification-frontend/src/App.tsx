import RefreshIcon from "@mui/icons-material/Refresh";
import {
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { NotificationList } from "./components/NotificationList";
import { TypeFilter } from "./components/TypeFilter";
import { useNotifications } from "./hooks/useNotifications";
import { useViewed } from "./hooks/useViewed";
import { FilterType, ViewMode } from "./types";

export default function App() {
  const [mode, setMode] = useState<ViewMode>("all");
  const [filter, setFilter] = useState<FilterType>("All");
  const [page, setPage] = useState(1);

  const { items, loading, error, reload } = useNotifications(mode, filter, page);
  const { viewed, markViewed, markAllViewed } = useViewed();

  const unreadCount = useMemo(
    () => items.filter((item) => !viewed.has(item.ID)).length,
    [items, viewed]
  );

  const handleModeChange = (next: ViewMode) => {
    setMode(next);
    setPage(1);
  };

  const handleFilterChange = (next: FilterType) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 2 }}>
            <Typography variant="h6">Notifications</Typography>
          </Badge>
          <Box flexGrow={1} />
          <IconButton color="inherit" onClick={reload} aria-label="refresh">
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Tabs
            value={mode}
            onChange={(_event, next) => handleModeChange(next as ViewMode)}
            variant="fullWidth"
          >
            <Tab label="All" value="all" />
            <Tab label="Priority Inbox" value="priority" />
          </Tabs>

          <TypeFilter value={filter} onChange={handleFilterChange} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread
            </Typography>
            <Button
              size="small"
              onClick={() => markAllViewed(items.map((item) => item.ID))}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </Stack>

          <NotificationList
            items={items}
            loading={loading}
            error={error}
            viewed={viewed}
            onView={markViewed}
            onRetry={reload}
          />

          {mode === "all" && !loading && !error && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" pt={1}>
              <Button
                variant="outlined"
                size="small"
                disabled={page === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <Typography variant="body2">Page {page}</Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={items.length < 10}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
