import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    
    // Admin-specific fields
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: true }, // Admins are pre-verified
    lastLogin: { type: Date },
    
    // Password management
    passwordChangedAt: { type: Date },
    mustChangePassword: { type: Boolean, default: false } // Admins don't need to change password
  },
  { 
    collection: 'users', // Explicitly use 'users' collection
    timestamps: true 
  }
);

// Hash password before save
adminSchema.pre("save", async function (next) {
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
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to check if password was changed after JWT was issued
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
