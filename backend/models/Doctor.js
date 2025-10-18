import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "doctor" },
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

    // Doctor-specific fields
    doctorType: {
      type: String,
      enum: ["ENT", "Obstetrics", "General", "Other"],
      required: true,
    },
    specialization: {
      type: String,
      enum: ["ENT", "Obstetrics", "General", "Other"],
    }, // Legacy field
    assignedPatients: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    ],

    // Common fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },

    // Password management
    passwordChangedAt: { type: Date },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
doctorSchema.pre("save", async function (next) {
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
doctorSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to check if password was changed after JWT was issued
doctorSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
