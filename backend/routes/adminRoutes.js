import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  getDashboardStats,
  assignPatientToDoctor,
  updateCredentials,
  getAllUsersForCredentials,
} from "../controllers/adminController.js";

const router = express.Router();

// Dashboard Stats
router.get("/stats", protect, authorizeRoles("Admin"), getDashboardStats);
router.get(
  "/dashboard-stats",
  protect,
  authorizeRoles("Admin"),
  getDashboardStats
);

// Assignment Routes
router.post("/assign-patient", assignPatientToDoctor);

// Credentials Management Routes
router.get(
  "/credentials",
  protect,
  authorizeRoles("Admin"),
  getAllUsersForCredentials
);
router.put("/credentials", protect, authorizeRoles("Admin"), updateCredentials);

export default router;
