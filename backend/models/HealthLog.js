const mongoose = require("mongoose");

const healthLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  logType: { type: String, enum: ["Symptom", "Vitals", "Lab"] },
  data: Object,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("HealthLog", healthLogSchema);
