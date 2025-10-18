import express from "express";
import { loginUser, registerUser, getMe } from '../controllers/multiAuthController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/auth/login - Multi-collection authentication
router.post("/login", loginUser);

// POST /api/auth/logout (stateless; frontend clears token)
router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me - Get current user info (multi-collection support)
router.get("/me", protect, getMe);

// POST /api/auth/register - Register new user (optional, admin-only)
router.post("/register", registerUser);

export default router;


