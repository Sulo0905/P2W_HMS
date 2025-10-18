import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import Patient from './models/Patient.js';
import Doctor from './models/Doctor.js';

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI_LOCAL;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Create Admin user
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      await Admin.create({
        username: 'admin',
        password: 'admin123',
        email: 'admin@path2wellness.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'Admin',
        phone: '1234567890',
        isActive: true,
        mustChangePassword: false
      });
      console.log('✅ Admin user created: username=admin, password=admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create Test Doctor
    const doctorExists = await Doctor.findOne({ username: 'doctor1' });
    if (!doctorExists) {
      await Doctor.create({
        username: 'doctor1',
        password: 'doctor123',
        email: 'doctor@path2wellness.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'Doctor',
        phone: '9876543210',
        specialization: 'ENT',
        doctorType: 'ENT',
        isActive: true,
        mustChangePassword: false
      });
      console.log('✅ Doctor user created: username=doctor1, password=doctor123');
    } else {
      console.log('ℹ️  Doctor user already exists');
    }

    // Create Test Patient
    const patientExists = await Patient.findOne({ username: 'patient1' });
    if (!patientExists) {
      await Patient.create({
        username: 'patient1',
        password: 'patient123',
        email: 'patient@path2wellness.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'Patient',
        phone: '5555555555',
        age: 28,
        gender: 'Female',
        category: 'ENT',
        patientType: 'ENT',
        isActive: true,
        mustChangePassword: false
      });
      console.log('✅ Patient user created: username=patient1, password=patient123');
    } else {
      console.log('ℹ️  Patient user already exists');
    }

    console.log('\n📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:   username=admin    password=admin123');
    console.log('Doctor:  username=doctor1  password=doctor123');
    console.log('Patient: username=patient1 password=patient123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
