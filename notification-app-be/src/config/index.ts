import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 4000,
  baseUrl:
    process.env.EVALUATION_BASE_URL ||
    "http://4.224.186.213/evaluation-service",
  priorityPageDepth: Number(process.env.PRIORITY_PAGE_DEPTH) || 6,
  credentials: {
    email: process.env.AUTH_EMAIL || "",
    name: process.env.AUTH_NAME || "",
    rollNo: process.env.AUTH_ROLL_NO || "",
    accessCode: process.env.AUTH_ACCESS_CODE || "",
    clientID: process.env.AUTH_CLIENT_ID || "",
    clientSecret: process.env.AUTH_CLIENT_SECRET || "",
  },
};
