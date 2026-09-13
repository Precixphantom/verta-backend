import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
// Requires Authorization: Bearer <token>
router.get('/me', requireAuth, getMe);

export default router;