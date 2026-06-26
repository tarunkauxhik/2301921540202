import { Router } from "express";
import {
  listNotifications,
  listPriority,
} from "../controllers/notifications";

const router = Router();

router.get("/notifications", listNotifications);
router.get("/notifications/priority", listPriority);

export default router;
