import express from "express";
import ReportsController from "../controllers/reportsController.js";
import asyncHandler from "express-async-handler";

const router = express.Router();
const reportsController = new ReportsController();

// GET comprehensive analytics report
router.get(
  "/analytics",
  asyncHandler((req, res) => reportsController.getAnalyticsReport(req, res))
);

// GET patient outcomes report
router.get(
  "/outcomes",
  asyncHandler((req, res) => reportsController.getPatientOutcomes(req, res))
);

// GET performance metrics
router.get(
  "/performance",
  asyncHandler((req, res) => reportsController.getPerformanceMetrics(req, res))
);

// GET treatment effectiveness analysis
router.get(
  "/treatment-effectiveness",
  asyncHandler((req, res) =>
    reportsController.getTreatmentEffectiveness(req, res)
  )
);

export default router;
