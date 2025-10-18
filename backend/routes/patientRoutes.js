import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  addHealthRecord,
  getPatientHealthRecords,
} from "../controllers/patientController.js";

const router = express.Router();

// Admin-only routes for patient management
router.post("/", createPatient);
router.get("/", getPatients);
router.get("/:id", getPatientById);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);

// Health records routes
router.post(
  "/:id/health-records",
  protect,
  authorizeRoles("Admin", "Doctor"),
  addHealthRecord
);
router.get(
  "/:id/health-records",
  protect,
  authorizeRoles("Admin", "Doctor"),
  getPatientHealthRecords
);

export default router;
