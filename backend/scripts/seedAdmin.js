import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";

dotenv.config();

// Helper function to check username uniqueness across all collections
const checkUsernameExists = async (username) => {
  const queries = [
    Admin.findOne({ username }),
    Patient.findOne({ username }),
    Doctor.findOne({ username })
  ];
  
  const results = await Promise.all(queries);
  return results.some(result => result !== null);
};

async function main() {
  try {
    const uri = "mongodb://localhost:27017/profileManagementDB"; // Force local connection
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Admin credentials (matching the existing system)
    const adminData = {
      username: "admin",
      password: "Admin123!@#",
      email: "admin@path2wellness.com",
      firstName: "System",
      lastName: "Administrator",
      role: "admin"
    };

    console.log('🔍 Checking if admin already exists...');
    const usernameExists = await checkUsernameExists(adminData.username);
    
    if (usernameExists) {
      console.log("✅ Admin already exists:", adminData.username);
      await mongoose.disconnect();
      return;
    }

    console.log('👤 Creating admin user in users collection...');
    const admin = await Admin.create(adminData);
    console.log("✅ Admin created successfully:", {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      collection: 'users'
    });

    // Create sample doctor in doctors collection
    console.log('👨‍⚕️ Creating sample doctor...');
    const doctorExists = await checkUsernameExists("drjohnson");
    if (!doctorExists) {
      const doctor = await Doctor.create({
        username: "drjohnson",
        password: "Doctor123!@#",
        email: "sarah.johnson@path2wellness.com",
        firstName: "Dr. Sarah",
        lastName: "Johnson",
        role: "doctor",
        doctorType: "ENT",
        specialization: "ENT",
        phone: "+1-555-0101",
        createdBy: admin._id
      });
      console.log("✅ Sample doctor created:", {
        id: doctor._id,
        username: doctor.username,
        collection: 'doctors'
      });
    } else {
      console.log("✅ Sample doctor already exists");
    }

    // Create sample patient in patients collection
    console.log('👤 Creating sample patient...');
    const patientExists = await checkUsernameExists("emmawilson");
    if (!patientExists) {
      const patient = await Patient.create({
        username: "emmawilson",
        password: "Patient123!@#",
        email: "emma.wilson@email.com",
        firstName: "Emma",
        lastName: "Wilson",
        role: "patient",
        patientType: "Gynecology",
        phone: "+1-555-0201",
        createdBy: admin._id
      });
      console.log("✅ Sample patient created:", {
        id: patient._id,
        username: patient.username,
        collection: 'patients'
      });
    } else {
      console.log("✅ Sample patient already exists");
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👨‍💼 Admin: admin / Admin123!@# (stored in users collection)');
    console.log('👨‍⚕️ Doctor: drjohnson / Doctor123!@# (stored in doctors collection)');
    console.log('👤 Patient: emmawilson / Patient123!@# (stored in patients collection)');
    
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


