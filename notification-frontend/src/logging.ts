import { Log, configureLogger } from "logging-middleware";

configureLogger({
  baseUrl: import.meta.env.VITE_EVALUATION_BASE_URL,
  credentials: {
    email: import.meta.env.VITE_AUTH_EMAIL,
    name: import.meta.env.VITE_AUTH_NAME,
    rollNo: import.meta.env.VITE_AUTH_ROLL_NO,
    accessCode: import.meta.env.VITE_AUTH_ACCESS_CODE,
    clientID: import.meta.env.VITE_AUTH_CLIENT_ID,
    clientSecret: import.meta.env.VITE_AUTH_CLIENT_SECRET,
  },
});

export { Log };
