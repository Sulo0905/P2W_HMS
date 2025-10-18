import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Import User model
import User from "../models/User.js";

async function setupAdminOnlyDatabase() {
  try {
    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://durankakalpana29_db_user:Y4v5Gn6XCsI0IyU2@path2wellness.qdqlijd.mongodb.net/profileManagementDB";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB Atlas - profileManagementDB");

    // Clear existing users (remove all dummy data)
    await User.deleteMany({});
    console.log("🗑️  Cleared all existing users");

    // Create only the default admin user
    const adminExists = await User.findOne({ email: "admin@path2wellness.com" });
    if (!adminExists) {
      const adminUser = new User({
        username: "admin",
        email: "admin@path2wellness.com",
        password: "Admin123!@#", // This will be hashed by the pre-save middleware
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
        phone: "+1-555-0000",
        isActive: true,
        isEmailVerified: true,
        createdBy: null // Self-created
      });
      
      await adminUser.save();
      console.log("✅ Default admin user created successfully");
      console.log("📧 Email: admin@path2wellness.com");
      console.log("🔑 Password: Admin123!@#");
      console.log("👤 Role: Admin");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    console.log("\n🎉 Database setup complete!");
    console.log("📋 Admin Login Credentials:");
    console.log("   Email: admin@path2wellness.com");
    console.log("   Password: Admin123!@#");
    console.log("\n✨ Ready for production with clean database!");
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the setup
setupAdminOnlyDatabase();
