import express from "express";
import asyncHandler from "express-async-handler";
import EntController from "../controllers/entLogController.js"; // ✅ Import the class

import {
  validatePatient,
  validateHealthLog,
  validateObjectId,
  validatePagination,
  validateDateRange,
} from "../middlewares/validationLog.js";

const router = express.Router();
const entController = new EntController(); // ✅ Create an instance of the class

// ✅ All routes now use instance methods

// GET all ENT patients (exclude soft-deleted by default)
router.get("/", asyncHandler(entController.getAllPatients.bind(entController)));

// GET single ENT patient by ID (exclude soft-deleted unless includeDeleted=true)
router.get(
  "/:id",
  validateObjectId(),
  asyncHandler(entController.getPatientById.bind(entController))
);

// GET ENT patient by patientId (exclude soft-deleted unless includeDeleted=true)
router.get(
  "/patient/:patientId",
  asyncHandler(entController.getPatientByPatientId.bind(entController))
);

// POST create new ENT patient
router.post(
  "/",
  validatePatient("ENT"),
  asyncHandler(entController.createPatient.bind(entController))
);

// PUT update ENT patient
router.put(
  "/:id",
  validateObjectId(),
  asyncHandler(entController.updatePatient.bind(entController))
);

// DELETE ENT patient (soft delete)
router.delete(
  "/:id",
  validateObjectId(),
  asyncHandler(entController.deletePatient.bind(entController))
);

// GET health logs for a patient with filters and pagination
router.get(
  "/:id/logs",
  validateObjectId(),
  validatePagination,
  validateDateRange,
  asyncHandler(entController.getHealthLogs.bind(entController))
);

// POST add health log
router.post(
  "/:id/logs",
  validateObjectId(),
  validateHealthLog,
  asyncHandler(entController.addHealthLog.bind(entController))
);

// PUT update health log
router.put(
  "/:id/logs/:logId",
  validateObjectId(),
  validateObjectId("logId"),
  asyncHandler(entController.updateHealthLog.bind(entController))
);

// DELETE health log (soft delete)
router.delete(
  "/:id/logs/:logId",
  validateObjectId(),
  validateObjectId("logId"),
  asyncHandler(entController.deleteHealthLog.bind(entController))
);

// GET logs by type
router.get(
  "/:id/logs/type/:logType",
  validateObjectId(),
  asyncHandler(entController.getLogsByType.bind(entController))
);

export default router;
