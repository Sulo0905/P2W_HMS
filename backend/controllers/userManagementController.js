import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';

// Helper function to check username uniqueness across all collections
const checkUsernameUniqueness = async (username, excludeId = null) => {
  const queries = [
    User.findOne({ username, ...(excludeId && { _id: { $ne: excludeId } }) }),
    Patient.findOne({ username, ...(excludeId && { _id: { $ne: excludeId } }) }),
    Doctor.findOne({ username, ...(excludeId && { _id: { $ne: excludeId } }) }),
    Admin.findOne({ username, ...(excludeId && { _id: { $ne: excludeId } }) })
  ];
  
  const results = await Promise.all(queries);
  return results.some(result => result !== null);
};

// Helper function to check email uniqueness across all collections
const checkEmailUniqueness = async (email, excludeId = null) => {
  const queries = [
    User.findOne({ email, ...(excludeId && { _id: { $ne: excludeId } }) }),
    Patient.findOne({ email, ...(excludeId && { _id: { $ne: excludeId } }) }),
    Doctor.findOne({ email, ...(excludeId && { _id: { $ne: excludeId } }) }),
    Admin.findOne({ email, ...(excludeId && { _id: { $ne: excludeId } }) })
  ];
  
  const results = await Promise.all(queries);
  return results.some(result => result !== null);
};

// @desc    Get all users from all collections
// @route   GET /api/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    console.log('📖 Fetching all users from all collections...');
    const { page = 1, limit = 50, role, search } = req.query;
    
    let allUsers = [];
    
    // Fetch from all collections based on role filter
    if (!role || role === 'admin') {
      const admins = await Admin.find({ isActive: { $ne: false } })
        .select('-password')
        .sort({ createdAt: -1 });
      allUsers = allUsers.concat(admins.map(admin => ({ ...admin.toObject(), collection: 'users' })));
    }
    
    if (!role || role === 'patient') {
      const patients = await Patient.find({ isActive: { $ne: false } })
        .select('-password')
        .populate('assignedDoctor', 'firstName lastName email doctorType')
        .sort({ createdAt: -1 });
      allUsers = allUsers.concat(patients.map(patient => ({ 
        ...patient.toObject(), 
        collection: 'patients',
        assignedDoctorName: patient.assignedDoctor ? 
          `${patient.assignedDoctor.firstName} ${patient.assignedDoctor.lastName}` : null
      })));
    }
    
    if (!role || role === 'doctor') {
      const doctors = await Doctor.find({ isActive: { $ne: false } })
        .select('-password')
        .populate('assignedPatients', 'firstName lastName email')
        .sort({ createdAt: -1 });
      allUsers = allUsers.concat(doctors.map(doctor => ({ ...doctor.toObject(), collection: 'doctors' })));
    }
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(user => 
        (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.username && user.username.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by creation date (newest first)
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
    console.log(`✅ Found ${allUsers.length} users total, returning ${paginatedUsers.length} for page ${page}`);
    
    res.status(200).json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allUsers.length,
        pages: Math.ceil(allUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new user (role-specific collection)
// @route   POST /api/users
// @access  Private (Admin only)
export const createUser = async (req, res) => {
  try {
    console.log('🔄 Creating new user...');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth,
      gender,
      address,
      patientType,
      doctorType
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: username, email, password, firstName, lastName, role'
      });
    }

    // Validate role-specific fields
    if (role === 'patient' && !patientType) {
      return res.status(400).json({
        success: false,
        message: 'Patient type is required for patients (ENT or Gynecology)'
      });
    }

    if (role === 'doctor' && !doctorType) {
      return res.status(400).json({
        success: false,
        message: 'Doctor type is required for doctors (ENT or Gynecology)'
      });
    }

    console.log('🔍 Checking for existing username and email...');
    
    // Check username uniqueness across all collections
    const usernameExists = await checkUsernameUniqueness(username);
    if (usernameExists) {
      console.log('❌ Username already exists:', username);
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Check email uniqueness across all collections
    const emailExists = await checkEmailUniqueness(email);
    if (emailExists) {
      console.log('❌ Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    console.log('💾 Creating user in appropriate collection...');
    
    let newUser;
    let collection;
    
    // Create user in appropriate collection based on role
    if (role === 'patient') {
      collection = 'patients';
      newUser = await Patient.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        dateOfBirth,
        gender,
        address,
        patientType,
        createdBy: req.user.id,
        mustChangePassword: true
      });
    } else if (role === 'doctor') {
      collection = 'doctors';
      newUser = await Doctor.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        dateOfBirth,
        gender,
        address,
        doctorType,
        specialization: doctorType, // For backward compatibility
        createdBy: req.user.id,
        mustChangePassword: true
      });
    } else if (role === 'admin') {
      collection = 'users';
      newUser = await Admin.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        mustChangePassword: false // Admins don't need to change password
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, doctor, or patient'
      });
    }

    console.log(`✅ User created successfully in ${collection} collection:`, newUser._id);

    // Remove password from response
    newUser.password = undefined;

    res.status(201).json({
      success: true,
      data: { ...newUser.toObject(), collection },
      message: `User created successfully in ${collection} collection`
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = async (req, res) => {
  try {
    console.log('✏️ Updating user with ID:', req.params.id);
    console.log('📝 Update data:', JSON.stringify(req.body, null, 2));
    
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      patientType,
      doctorType,
      isActive
    } = req.body;

    // Try to find user in all collections
    let user = null;
    let Model = null;
    let collection = null;
    
    // Check users collection (admins)
    user = await Admin.findById(req.params.id);
    if (user) {
      Model = Admin;
      collection = 'users';
    }
    
    // Check patients collection
    if (!user) {
      user = await Patient.findById(req.params.id);
      if (user) {
        Model = Patient;
        collection = 'patients';
      }
    }
    
    // Check doctors collection
    if (!user) {
      user = await Doctor.findById(req.params.id);
      if (user) {
        Model = Doctor;
        collection = 'doctors';
      }
    }

    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ Found user in ${collection} collection, updating...`);

    // Prepare update data based on user type
    const updateData = {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      isActive,
      updatedAt: new Date()
    };
    
    // Add role-specific fields
    if (collection === 'patients' && patientType) {
      updateData.patientType = patientType;
    }
    if (collection === 'doctors' && doctorType) {
      updateData.doctorType = doctorType;
      updateData.specialization = doctorType; // For backward compatibility
    }

    // Update user
    const updatedUser = await Model.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    console.log(`✅ User updated successfully in ${collection}:`, updatedUser._id);

    res.status(200).json({
      success: true,
      data: { ...updatedUser.toObject(), collection },
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = async (req, res) => {
  try {
    console.log('🗑️ Deleting user with ID:', req.params.id);
    
    // Try to find user in all collections
    let user = null;
    let Model = null;
    let collection = null;
    
    // Check users collection (admins)
    user = await Admin.findById(req.params.id);
    if (user) {
      Model = Admin;
      collection = 'users';
    }
    
    // Check patients collection
    if (!user) {
      user = await Patient.findById(req.params.id);
      if (user) {
        Model = Patient;
        collection = 'patients';
      }
    }
    
    // Check doctors collection
    if (!user) {
      user = await Doctor.findById(req.params.id);
      if (user) {
        Model = Doctor;
        collection = 'doctors';
      }
    }

    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      console.log('❌ Cannot delete admin user');
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    console.log(`💾 Performing hard delete from ${collection} collection...`);
    // Hard delete - completely remove from database
    await Model.findByIdAndDelete(req.params.id);

    console.log(`✅ User deleted successfully from ${collection}:`, req.params.id);

    res.status(200).json({
      success: true,
      message: `User deleted successfully from ${collection} collection`
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/statistics
// @access  Private (Admin only)
export const getUserStatistics = async (req, res) => {
  try {
    console.log('📊 Fetching user statistics...');
    
    const [adminCount, patientCount, doctorCount] = await Promise.all([
      Admin.countDocuments({ isActive: { $ne: false } }),
      Patient.countDocuments({ isActive: { $ne: false } }),
      Doctor.countDocuments({ isActive: { $ne: false } })
    ]);
    
    const [entPatients, gynecologyPatients] = await Promise.all([
      Patient.countDocuments({ patientType: 'ENT', isActive: { $ne: false } }),
      Patient.countDocuments({ patientType: 'Gynecology', isActive: { $ne: false } })
    ]);
    
    const [entDoctors, gynecologyDoctors] = await Promise.all([
      Doctor.countDocuments({ doctorType: 'ENT', isActive: { $ne: false } }),
      Doctor.countDocuments({ doctorType: 'Gynecology', isActive: { $ne: false } })
    ]);
    
    const statistics = {
      total: adminCount + patientCount + doctorCount,
      admins: adminCount,
      patients: {
        total: patientCount,
        ENT: entPatients,
        Gynecology: gynecologyPatients
      },
      doctors: {
        total: doctorCount,
        ENT: entDoctors,
        Gynecology: gynecologyDoctors
      },
      collections: {
        users: adminCount,
        patients: patientCount,
        doctors: doctorCount
      }
    };
    
    console.log('✅ Statistics generated:', statistics);
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Assign doctor to patient (multi-collection support)
// @route   PATCH /api/users/:patientId/assign-doctor
// @access  Private (Admin only)
export const assignDoctorToPatient = async (req, res) => {
  try {
    console.log('🔄 Assigning doctor to patient...');
    console.log('Patient ID:', req.params.patientId);
    console.log('Doctor ID:', req.body.doctorId);
    
    const { doctorId } = req.body;
    const patientId = req.params.patientId;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    // Find patient in patients collection
    const patient = await Patient.findById(patientId);
    if (!patient) {
      console.log('❌ Patient not found:', patientId);
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Find doctor in doctors collection
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log('❌ Doctor not found:', doctorId);
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    console.log(`✅ Found patient: ${patient.firstName} ${patient.lastName}`);
    console.log(`✅ Found doctor: ${doctor.firstName} ${doctor.lastName}`);

    // Update patient's assigned doctor
    patient.assignedDoctor = doctorId;
    await patient.save();

    // Add patient to doctor's assigned patients if not already there
    if (!doctor.assignedPatients.includes(patientId)) {
      doctor.assignedPatients.push(patientId);
      await doctor.save();
    }

    console.log('✅ Assignment completed successfully');

    res.status(200).json({
      success: true,
      message: 'Doctor assigned to patient successfully',
      data: {
        patient: {
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`,
          assignedDoctor: doctorId
        },
        doctor: {
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`
        }
      }
    });
  } catch (error) {
    console.error('❌ Error assigning doctor to patient:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export default {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserStatistics,
  assignDoctorToPatient
};
