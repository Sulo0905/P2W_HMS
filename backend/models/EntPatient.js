import mongoose from "mongoose";

const entLogSchema = new mongoose.Schema({
  logType: {
    type: String,
    required: true,
    enum: ["pain_level", "breathing_issues", "medication", "healing_progress"],
  },
  // Who and when
  loggedBy: { type: String },
  loggedAt: { type: Date, default: Date.now },
  painLevel: {
    type: Number,
    min: 0,
    max: 10,
    required: function () {
      return this.logType === "pain_level";
    },
  },
  breathingIssues: {
    hasIssues: { type: Boolean, default: false },
    description: String,
    severity: {
      type: String,
      enum: ["mild", "moderate", "severe"],
      required: function () {
        return (
          this.logType === "breathing_issues" && this.breathingIssues.hasIssues
        );
      },
    },
  },
  throatDiscomfort: {
    hasDiscomfort: { type: Boolean, default: false },
    description: String,
    severity: {
      type: String,
      enum: ["mild", "moderate", "severe"],
      required: function () {
        return (
          this.logType === "breathing_issues" &&
          this.throatDiscomfort.hasDiscomfort
        );
      },
    },
  },
  medication: {
    name: {
      type: String,
      required: function () {
        return this.logType === "medication";
      },
    },
    dosage: {
      type: String,
      required: function () {
        return this.logType === "medication";
      },
    },
    frequency: {
      type: String,
      required: function () {
        return this.logType === "medication";
      },
    },
    sideEffects: [String],
    takenAt: { type: Date, default: Date.now },
  },
  healingProgress: {
    woundCondition: {
      type: String,
      enum: ["healing_well", "minor_issues", "concerning", "needs_attention"],
      required: function () {
        return this.logType === "healing_progress";
      },
    },
    notes: String,
    photos: [String], // URLs to uploaded photos
    nextCheckup: Date,
  },
  notes: String,
  // Soft delete
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  // Audit trail (captures change payloads)
  history: [
    {
      timestamp: { type: Date, default: Date.now },
      updatedBy: String,
      changes: mongoose.Schema.Types.Mixed,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const entPatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ["male", "female", "other"] },
  phone: { type: String, required: true },
  email: String,
  surgeryDate: { type: Date },
  surgeryType: { type: String },
  doctor: String,
  hospital: String,
  logs: [entLogSchema],
  // Soft delete at patient level
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
entPatientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

entLogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const EntPatient = mongoose.model("EntPatient", entPatientSchema);

export default EntPatient;
