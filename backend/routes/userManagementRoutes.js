import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserStatistics,
  assignDoctorToPatient
} from '../controllers/userManagementController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin-only routes for user management across collections
router.get('/', authorize('admin'), getAllUsers);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.patch('/:patientId/assign-doctor', authorize('admin'), assignDoctorToPatient);
router.get('/statistics', authorize('admin'), getUserStatistics);

export default router;
