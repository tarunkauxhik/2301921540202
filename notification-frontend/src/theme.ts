import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#3949ab" },
    secondary: { main: "#00897b" },
    background: { default: "#f4f5fb" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
  },
});

export const TYPE_COLORS: Record<string, "primary" | "secondary" | "warning" | "success" | "default"> = {
  Event: "primary",
  Result: "success",
  General: "default",
  Placement: "warning",
};
