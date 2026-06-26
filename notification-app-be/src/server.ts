import app from "./app";
import { config } from "./config";
import { Log } from "./logging";

app.listen(config.port, () => {
  Log("backend", "info", "service", `notification backend listening on port ${config.port}`);
});
