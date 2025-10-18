import express from "express";
import {
  createEntCarePlan,
  getAllEntCarePlans,
  getEntCarePlanById,
  updateEntCarePlan,
  deleteEntCarePlan,
  getEntCarePlansByPatient,
} from "../controllers/entController.js";
import { validateEntCarePlan } from "../middlewares/validation.js";

const router = express.Router();

router.post("/care-plans", validateEntCarePlan, createEntCarePlan);
router.get("/care-plans", getAllEntCarePlans);
router.get("/care-plans/:id", getEntCarePlanById);
router.put("/care-plans/:id", validateEntCarePlan, updateEntCarePlan);
router.delete("/care-plans/:id", deleteEntCarePlan);
router.get("/patients/:patientId/care-plans", getEntCarePlansByPatient);

export default router;
