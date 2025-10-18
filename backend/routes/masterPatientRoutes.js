import express from "express";
import asyncHandler from "express-async-handler";
import MasterPatientController from "../controllers/masterPatientController.js";

const router = express.Router();
const masterPatientController = new MasterPatientController();

// ✅ Register new patient
router.post(
  "/register",
  asyncHandler((req, res) => masterPatientController.registerPatient(req, res))
);

// ✅ Check if patient ID exists
router.post(
  "/check",
  asyncHandler((req, res) => masterPatientController.checkPatientId(req, res))
);

// ✅ Search patients
router.get(
  "/search",
  asyncHandler((req, res) => masterPatientController.searchPatients(req, res))
);

// ✅ Get patient by patientId
router.get(
  "/:patientId",
  asyncHandler((req, res) =>
    masterPatientController.getPatientByPatientId?.(req, res)
  )
);

export default router;
