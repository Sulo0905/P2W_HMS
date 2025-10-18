import mongoose from "mongoose";

const masterPatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    // Require gender only for ENT patients
    required: function () {
      return this.category === "ENT";
    },
  },
  contact: {
    phone: { type: String },
    email: { type: String },
  },
  category: { type: String, enum: ["ENT", "Obstetrics"], required: true },
  entInfo: {
    surgeryType: String,
    surgeryDate: Date,
  },
  obstetricsInfo: {
    estimatedDueDate: Date,
  },
  // References to category-specific records (created at registration)
  entRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "EntPatient" },
  obstetricsRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ObstetricsPatient",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

masterPatientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const MasterPatient = mongoose.model("MasterPatient", masterPatientSchema);

export default MasterPatient;
