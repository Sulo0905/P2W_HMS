import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";

const router = express.Router();

// Public routes (for admin use)
router.post("/", protect, authorizeRoles("admin"), createDoctor);
router.get("/", getDoctors);
router.get("/:id", getDoctorById);
router.put("/:id", protect, authorizeRoles("admin"), updateDoctor);
router.delete("/:id", protect, authorizeRoles("admin"), deleteDoctor);

export default router;
