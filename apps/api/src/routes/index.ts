import { Router } from "express";
import authRoutes from "./auth";
import activitiesRoutes from "./activities";
import analyticsRoutes from "./analytics";
import goalsRoutes from "./goals";
import platformsRoutes from "./platforms";
import syncRoutes from "./sync";
import streaksRoutes from "./streaks";
import achievementsRoutes from "./achievements";
import haRoutes from "./ha";

const router = Router();

router.use("/auth", authRoutes);
router.use("/activities", activitiesRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/goals", goalsRoutes);
router.use("/platforms", platformsRoutes);
router.use("/sync", syncRoutes);
router.use("/streaks", streaksRoutes);
router.use("/achievements", achievementsRoutes);
router.use("/ha", haRoutes);

export default router;
