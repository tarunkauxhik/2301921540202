import { Log, configureLogger } from "logging-middleware";
import { config } from "../config";

configureLogger({
  baseUrl: config.baseUrl,
  credentials: config.credentials,
});

export { Log };
