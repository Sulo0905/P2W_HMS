import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  assignDoctorToPatient,
  getUsersByRole,
  changePassword,
  getUserStatistics
} from '../controllers/userCrudController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes (no authentication required)
// None for CRUD operations

// Protected routes (authentication required)
router.use(protect); // All routes below require authentication

// Profile routes (accessible by authenticated users)
router.get('/profile', getUserProfile);
router.get('/me', getUserProfile); // Alias for /profile
router.put('/profile', updateUserProfile);
router.put('/me', updateUserProfile); // Alias for /profile

// Password management
router.put('/change-password', changePassword);

// Role-based routes
router.get('/role/:role', getUsersByRole);

// Admin-only routes
router.get('/', authorize('admin'), getAllUsers);
router.post('/', authorize('admin'), createUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:patientId/assign-doctor', authorize('admin'), assignDoctorToPatient);
router.get('/statistics', authorize('admin'), getUserStatistics);

// User management routes (accessible by user themselves or admin)
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);

export default router;
