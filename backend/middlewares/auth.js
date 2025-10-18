import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Admin from '../models/Admin.js';

// Helper function to find user across all collections
const findUserById = async (id) => {
  const models = [
    { model: Admin, collection: 'users' },
    { model: Patient, collection: 'patients' },
    { model: Doctor, collection: 'doctors' },
    { model: User, collection: 'users' } // Legacy support
  ];
  
  for (const { model, collection } of models) {
    const user = await model.findById(id).select('-password');
    if (user) {
      return { user, collection };
    }
  }
  
  return { user: null, collection: null };
};

// Protect routes - verify JWT token (multi-collection support)
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token across all collections
      const { user, collection } = await findUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      if (user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Attach user and collection info to request
      req.user = user;
      req.userCollection = collection;
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Normalize roles to lowercase for comparison
    const normalizedRoles = roles.map(role => role.toLowerCase());
    const userRole = req.user.role.toLowerCase();

    console.log('🔐 Authorization check:');
    console.log('   User role:', req.user.role, '(normalized:', userRole + ')');
    console.log('   Required roles:', roles, '(normalized:', normalizedRoles + ')');
    console.log('   Is authorized:', normalizedRoles.includes(userRole));

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};
