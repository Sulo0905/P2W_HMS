import express from "express";
import asyncHandler from "express-async-handler";
import ObstetricsController from "../controllers/obstetricsLogController.js";
import {
  validatePatient,
  validateHealthLog,
  validateObjectId,
  validatePagination,
  validateDateRange,
} from "../middlewares/validationLog.js";

const router = express.Router();
const obstetricsController = new ObstetricsController();

// GET all obstetrics patients
router.get(
  "/",
  asyncHandler((req, res) => obstetricsController.getAllPatients(req, res))
);

// GET single obstetrics patient by ID
router.get(
  "/:id",
  validateObjectId(),
  asyncHandler((req, res) => obstetricsController.getPatientById(req, res))
);

// GET obstetrics patient by patientId
router.get(
  "/patient/:patientId",
  asyncHandler((req, res) =>
    obstetricsController.getPatientByPatientId(req, res)
  )
);

// POST create new obstetrics patient
router.post(
  "/",
  validatePatient("Obstetrics"),
  asyncHandler((req, res) => obstetricsController.createPatient(req, res))
);

// PUT update obstetrics patient
router.put(
  "/:id",
  validateObjectId(),
  asyncHandler((req, res) => obstetricsController.updatePatient(req, res))
);

// DELETE obstetrics patient
router.delete(
  "/:id",
  validateObjectId(),
  asyncHandler((req, res) => obstetricsController.deletePatient(req, res))
);

// GET health logs for a patient
router.get(
  "/:id/logs",
  validateObjectId(),
  validatePagination,
  validateDateRange,
  asyncHandler((req, res) => obstetricsController.getHealthLogs(req, res))
);

// POST add health log
router.post(
  "/:id/logs",
  validateObjectId(),
  validateHealthLog,
  asyncHandler((req, res) => obstetricsController.addHealthLog(req, res))
);

// PUT update health log
router.put(
  "/:id/logs/:logId",
  validateObjectId(),
  validateObjectId("logId"),
  asyncHandler((req, res) => obstetricsController.updateHealthLog(req, res))
);

// DELETE health log
router.delete(
  "/:id/logs/:logId",
  validateObjectId(),
  validateObjectId("logId"),
  asyncHandler((req, res) => obstetricsController.deleteHealthLog(req, res))
);

// GET logs by type
router.get(
  "/:id/logs/type/:logType",
  validateObjectId(),
  asyncHandler((req, res) => obstetricsController.getLogsByType(req, res))
);

// GET pregnancy timeline
router.get(
  "/:id/timeline",
  validateObjectId(),
  asyncHandler((req, res) => obstetricsController.getTimeline(req, res))
);

// GET pregnancy progress
router.get(
  "/:id/progress",
  validateObjectId(),
  asyncHandler((req, res) => obstetricsController.getProgress(req, res))
);

export default router;
