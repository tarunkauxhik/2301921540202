import cors from "cors";
import express from "express";
import { Log } from "./logging";
import { requestLogger } from "./middleware/requestLogger";
import notificationRoutes from "./routes/notifications";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", notificationRoutes);

app.use((_req, res) => {
  Log("backend", "warn", "route", "route not found");
  res.status(404).json({ message: "Not found" });
});

export default app;
