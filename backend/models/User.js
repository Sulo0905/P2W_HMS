import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "doctor", "patient"],
      required: true,
    },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },

    // NEW: Patient and Doctor Types
    patientType: {
      type: String,
      enum: ["ENT", "Obstetrics", "General", "Other"],
      required: function () {
        return this.role === "patient";
      },
    },
    doctorType: {
      type: String,
      enum: ["ENT", "Obstetrics", "General", "Other"],
      required: function () {
        return this.role === "doctor";
      },
    },

    // Legacy fields for backward compatibility
    doctorSpecialization: {
      type: String,
      enum: ["ENT", "Obstetrics", "General", "Other"],
    },
    patientCategory: {
      type: String,
      enum: ["ENT", "Obstetrics", "General", "Other"],
    },

    assignedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    profilePicture: { type: String },

    // Password management
    passwordChangedAt: { type: Date },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Conditional validation for doctor and patient types
userSchema.path("doctorType").validate(function (value) {
  if (this.role === "doctor" && !value) return false;
  return true;
}, "doctorType is required for doctor role");

userSchema.path("patientType").validate(function (value) {
  if (this.role === "patient" && !value) return false;
  return true;
}, "patientType is required for patient role");

// Legacy validation for backward compatibility
userSchema.path("doctorSpecialization").validate(function (value) {
  if (this.role === "doctor" && !value && !this.doctorType) return false;
  return true;
}, "doctorSpecialization or doctorType is required for doctor role");

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Set password changed timestamp
  if (this.isModified("password") && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to get user type based on role
userSchema.methods.getUserType = function () {
  if (this.role === "doctor") {
    return this.doctorType || this.doctorSpecialization;
  }
  if (this.role === "patient") {
    return this.patientType || this.patientCategory;
  }
  return null;
};

const User = mongoose.model("User", userSchema);
export default User;
