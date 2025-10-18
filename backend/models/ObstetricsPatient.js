import mongoose from "mongoose";

const obstetricsLogSchema = new mongoose.Schema({
  logType: {
    type: String,
    required: true,
    enum: [
      "vitals_tests",
      "trimester_symptoms",
      "baby_movement",
      "sleep_nutrition",
      "postnatal_recovery",
    ],
  },
  // Who and when
  loggedBy: { type: String },
  loggedAt: { type: Date, default: Date.now },
  trimester: {
    type: Number,
    min: 1,
    max: 3,
    required: function () {
      return this.logType === "trimester_symptoms";
    },
  },
  symptoms: {
    nausea: {
      hasSymptom: { type: Boolean, default: false },
      severity: { type: String, enum: ["mild", "moderate", "severe"] },
      notes: String,
    },
    cramps: {
      hasSymptom: { type: Boolean, default: false },
      severity: { type: String, enum: ["mild", "moderate", "severe"] },
      notes: String,
    },
    mood: {
      level: {
        type: String,
        enum: ["excellent", "good", "okay", "poor", "very_poor"],
      },
      notes: String,
    },
    otherSymptoms: [String],
  },
  babyMovement: {
    movementCount: { type: Number, min: 0 },
    duration: { type: Number }, // in minutes
    notes: String,
    timeOfDay: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
    },
  },
  vitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
    },
    sugarLevel: Number,
    weightKg: Number,
    fetalHeartRate: Number,
  },
  sleepNutrition: {
    sleepHours: { type: Number, min: 0, max: 24 },
    sleepQuality: { type: String, enum: ["excellent", "good", "fair", "poor"] },
    nutritionNotes: String,
    waterIntake: { type: Number }, // in liters
    supplements: [String],
    cravings: [String],
  },
  medications: [
    {
      name: String,
      dose: String,
      frequency: String,
      startDate: Date,
      endDate: Date,
    },
  ],
  tests: {
    ultrasound: {
      date: Date,
      findings: String,
      notes: String,
    },
    labs: [
      {
        name: String,
        value: String,
        unit: String,
        referenceRange: String,
        date: Date,
      },
    ],
  },
  postnatalRecovery: {
    bleeding: {
      hasBleeding: { type: Boolean, default: false },
      severity: { type: String, enum: ["light", "moderate", "heavy"] },
      color: { type: String, enum: ["red", "pink", "brown", "yellow"] },
    },
    stitches: {
      hasStitches: { type: Boolean, default: false },
      condition: {
        type: String,
        enum: ["healing_well", "minor_issues", "concerning"],
      },
      notes: String,
    },
    breastfeeding: {
      isBreastfeeding: { type: Boolean, default: false },
      frequency: { type: Number }, // times per day
      duration: { type: Number }, // minutes per session
      issues: [String],
      notes: String,
    },
    painLevel: { type: Number, min: 0, max: 10 },
    energyLevel: { type: String, enum: ["high", "medium", "low"] },
  },
  notes: String,
  // Soft delete
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  // Audit trail
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

const obstetricsPatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  email: String,
  dueDate: { type: Date, required: true },
  pregnancyNumber: { type: Number, default: 1 },
  doctor: String,
  hospital: String,
  isPostnatal: { type: Boolean, default: false },
  deliveryDate: Date,
  deliveryType: { type: String, enum: ["natural", "cesarean", "assisted"] },
  babyWeight: Number, // in kg
  babyLength: Number, // in cm
  logs: [obstetricsLogSchema],
  // Soft delete at patient level
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
obstetricsPatientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

obstetricsLogSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const ObstetricsPatient = mongoose.model(
  "ObstetricsPatient",
  obstetricsPatientSchema
);

export default ObstetricsPatient;
