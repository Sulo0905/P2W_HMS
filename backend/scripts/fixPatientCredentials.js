import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare');

const patientSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: String,
  category: String,
  isActive: { type: Boolean, default: true }
});

const Patient = mongoose.model('Patient', patientSchema);

async function fixPatientCredentials() {
  try {
    const patients = await Patient.find({});
    console.log(`Found ${patients.length} patients`);
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      
      // Generate username from name if missing
      if (!patient.username) {
        let username = patient.name.toLowerCase().replace(/\s+/g, '');
        
        // Check if username already exists
        const existingUser = await Patient.findOne({ username: username, _id: { $ne: patient._id } });
        if (existingUser) {
          username = username + (i + 1);
        }
        
        // Set default password
        const defaultPassword = 'patient123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);
        
        await Patient.findByIdAndUpdate(patient._id, {
          username: username,
          password: hashedPassword
        });
        
        console.log(`Updated patient: ${patient.name}`);
        console.log(`  Username: ${username}`);
        console.log(`  Password: ${defaultPassword}`);
        console.log('---');
      }
    }
    
    console.log('All patients updated successfully!');
  } catch (error) {
    console.error('Error updating patients:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixPatientCredentials();
