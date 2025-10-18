import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Import models
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";

async function setupPath2WellnessDatabase() {
  try {
    // Connect to the new database
    await mongoose.connect("mongodb://localhost:27017/path2wellness");
    console.log("✅ Connected to path2wellness database");

    // Create admin user
    const adminExists = await User.findOne({ username: "testAdmin" });
    if (!adminExists) {
      const adminUser = new User({
        username: "testAdmin",
        email: "admin@path2wellness.com",
        password: "admin123",
        role: "Admin"
      });
      await adminUser.save();
      console.log("✅ Admin user created");
      console.log("   Username: testAdmin");
      console.log("   Password: admin123");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Create sample doctors
    const doctorCount = await Doctor.countDocuments();
    if (doctorCount === 0) {
      const sampleDoctors = [
        {
          name: "Dr. Sarah Johnson",
          username: "drjohnson",
          password: "doctor123",
          email: "sarah.johnson@path2wellness.com",
          specialization: "ENT",
          phone: "+1-555-0101",
          experience: 8,
          qualification: "MBBS, MS (ENT)",
          consultationFee: 150,
          availability: ["Monday", "Tuesday", "Wednesday", "Friday"],
          isActive: true
        },
        {
          name: "Dr. Maria Rodriguez",
          username: "drrodriguez",
          password: "doctor123",
          email: "maria.rodriguez@path2wellness.com",
          specialization: "Gynecology",
          phone: "+1-555-0102",
          experience: 12,
          qualification: "MBBS, MD (Gynecology)",
          consultationFee: 200,
          availability: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday"],
          isActive: true
        }
      ];

      for (const doctorData of sampleDoctors) {
        const doctor = new Doctor(doctorData);
        await doctor.save();
        console.log(`✅ Created doctor: ${doctorData.name}`);
      }
    } else {
      console.log("ℹ️  Doctors already exist in database");
    }

    // Create sample patients
    const patientCount = await Patient.countDocuments();
    if (patientCount === 0) {
      const samplePatients = [
        {
          name: "Emma Wilson",
          username: "emmawilson",
          password: "patient123",
          email: "emma.wilson@email.com",
          phone: "+1-555-0201",
          age: 28,
          gender: "Female",
          category: "Pregnancy",
          isActive: true
        },
        {
          name: "John Smith",
          username: "johnsmith",
          password: "patient123",
          email: "john.smith@email.com",
          phone: "+1-555-0202",
          age: 35,
          gender: "Male",
          category: "ENT",
          isActive: true
        },
        {
          name: "Lisa Chen",
          username: "lisachen",
          password: "patient123",
          email: "lisa.chen@email.com",
          phone: "+1-555-0203",
          age: 26,
          gender: "Female",
          category: "Pregnancy",
          isActive: true
        }
      ];

      for (const patientData of samplePatients) {
        const patient = new Patient(patientData);
        await patient.save();
        console.log(`✅ Created patient: ${patientData.name}`);
      }
    } else {
      console.log("ℹ️  Patients already exist in database");
    }

    console.log("\n🎉 Path2Wellness database setup complete!");
    console.log("\n📋 Login Credentials:");
    console.log("Admin: testAdmin / admin123");
    console.log("Doctors: drjohnson / doctor123, drrodriguez / doctor123");
    console.log("Patients: emmawilson / patient123, johnsmith / patient123, lisachen / patient123");
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  } finally {
    mongoose.connection.close();
  }
}

setupPath2WellnessDatabase();
