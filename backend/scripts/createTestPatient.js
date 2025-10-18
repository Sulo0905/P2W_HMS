const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare');

const patientSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: String,
  category: { type: String, enum: ['Pregnancy', 'ENT'], default: 'Pregnancy' },
  isActive: { type: Boolean, default: true }
});

patientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

patientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Patient = mongoose.model('Patient', patientSchema);

async function createTestPatient() {
  try {
    // Check if patient already exists
    const existingPatient = await Patient.findOne({ username: 'uthsara' });
    if (existingPatient) {
      console.log('Patient uthsara already exists');
      mongoose.connection.close();
      return;
    }

    const testPatient = new Patient({
      username: 'uthsara',
      name: 'Uthsara Perera',
      email: 'uthsara@example.com',
      password: 'patient123',
      phone: '+94771234567',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Female',
      address: '123 Main Street, Colombo',
      category: 'Pregnancy'
    });

    await testPatient.save();
    console.log('Test patient created successfully!');
    console.log('Username: uthsara');
    console.log('Password: patient123');
  } catch (error) {
    console.error('Error creating patient:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestPatient();
