
import mongoose from "mongoose";

const carePlanSchema = new mongoose.Schema({
  type: { type: String, enum: ["Pregnancy Tracker", "ENT Prep"], required: true },
  template: Object,
  startDate: Date,
  endDate: Date,
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true }
}, { timestamps: true });

export default mongoose.model("CarePlan", carePlanSchema);
