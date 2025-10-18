import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    console.log('📖 Fetching all users...');
    const { page = 1, limit = 50, role, search } = req.query;
    
    // Build query - only show active users by default
    let query = { isActive: { $ne: false } }; // Include users where isActive is true or undefined
    
    if (role) {
      query.role = role;
      console.log('🔍 Filtering by role:', role);
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
      console.log('🔍 Searching for:', search);
    }

    console.log('📝 Query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .populate('assignedDoctor', 'firstName lastName email')
      .populate('assignedPatients', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    console.log(`✅ Found ${users.length} users (total: ${total})`);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedDoctor', 'firstName lastName email doctorSpecialization')
      .populate('assignedPatients', 'firstName lastName email patientCategory');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new user
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
      doctorSpecialization,
      patientCategory,
      doctorType,
      patientType
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

    console.log('🔍 Checking for existing user...');
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email);
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    console.log('💾 Creating user in database...');
    
    // Prepare user data - only include relevant type fields
    const userData = {
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
      createdBy: req.user.id,
      mustChangePassword: true // User must change password on first login
    };
    
    // Only add type fields if they have values and match the role
    if (role === 'patient' && patientType) {
      userData.patientType = patientType;
    }
    if (role === 'doctor' && doctorType) {
      userData.doctorType = doctorType;
    }
    
    // Legacy fields for backward compatibility
    if (doctorSpecialization) {
      userData.doctorSpecialization = doctorSpecialization;
    }
    if (patientCategory) {
      userData.patientCategory = patientCategory;
    }
    
    console.log('Final user data for creation:', JSON.stringify(userData, null, 2));
    
    // Create user
    const user = await User.create(userData);

    console.log('✅ User created successfully:', user._id);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
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
// @access  Private
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
      doctorSpecialization,
      patientCategory,
      doctorType,
      patientType,
      isActive
    } = req.body;

    // Find user
    let user = await User.findById(req.params.id);

    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Permission check is handled by the authorize('admin') middleware in routes
    console.log('✅ Admin authorization passed, proceeding with update');

    console.log('💾 Updating user in database...');
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        address,
        doctorSpecialization,
        patientCategory,
        doctorType,
        patientType,
        isActive,
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    console.log('✅ User updated successfully:', user._id);

    res.status(200).json({
      success: true,
      data: user,
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
    
    const user = await User.findById(req.params.id);

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

    console.log('💾 Performing hard delete from database...');
    // Hard delete - completely remove from database
    await User.findByIdAndDelete(req.params.id);

    console.log('✅ User deleted successfully:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
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

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('assignedDoctor', 'firstName lastName email doctorSpecialization')
      .populate('assignedPatients', 'firstName lastName email patientCategory');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      profilePicture
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        address,
        profilePicture,
        lastLogin: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Assign doctor to patient
// @route   PUT /api/users/:patientId/assign-doctor
// @access  Private (Admin only)
export const assignDoctorToPatient = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'Patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'Doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update patient's assigned doctor
    await User.findByIdAndUpdate(patientId, { assignedDoctor: doctorId });

    // Add patient to doctor's assigned patients
    await User.findByIdAndUpdate(doctorId, {
      $addToSet: { assignedPatients: patientId }
    });

    res.status(200).json({
      success: true,
      message: 'Doctor assigned to patient successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const users = await User.find({ role, isActive: true })
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role, isActive: true });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get user statistics by type
// @route   GET /api/users/statistics
// @access  Private (Admin only)
export const getUserStatistics = async (req, res) => {
  try {
    // Get patient statistics by type
    const patientStats = await User.aggregate([
      { $match: { role: 'patient', isActive: true } },
      { 
        $group: { 
          _id: { $ifNull: ['$patientType', '$patientCategory'] },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get doctor statistics by type
    const doctorStats = await User.aggregate([
      { $match: { role: 'doctor', isActive: true } },
      { 
        $group: { 
          _id: { $ifNull: ['$doctorType', '$doctorSpecialization'] },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalPatients = await User.countDocuments({ role: 'patient', isActive: true });
    const totalDoctors = await User.countDocuments({ role: 'doctor', isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });

    res.status(200).json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          patients: totalPatients,
          doctors: totalDoctors,
          admins: totalAdmins
        },
        patientsByType: patientStats,
        doctorsByType: doctorStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
