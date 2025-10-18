import express from "express";
import {
  createObstetricsCarePlan,
  getAllObstetricsCarePlans,
  getObstetricsCarePlanById,
  updateObstetricsCarePlan,
  deleteObstetricsCarePlan,
  getObstetricsCarePlansByPatient,
  addBreastfeedingLog,
} from "../controllers/obstetricsController.js";
import {
  validateObstetricsCarePlan,
  validateBreastfeedingLog,
} from "../middlewares/validation.js";

const router = express.Router();

router.post(
  "/care-plans",
  validateObstetricsCarePlan,
  createObstetricsCarePlan
);
router.get("/care-plans", getAllObstetricsCarePlans);
router.get("/care-plans/:id", getObstetricsCarePlanById);
router.put(
  "/care-plans/:id",
  validateObstetricsCarePlan,
  updateObstetricsCarePlan
);
router.delete("/care-plans/:id", deleteObstetricsCarePlan);
router.get("/patients/:patientId/care-plans", getObstetricsCarePlansByPatient);
router.post(
  "/care-plans/:id/breastfeeding-log",
  validateBreastfeedingLog,
  addBreastfeedingLog
);

export default router;
