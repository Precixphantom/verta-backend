import express from 'express';
import { getAptitudeQuestions, submitAptitude } from '../controllers/aptitudeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/aptitude/questions?level=JSS
router.get('/questions', getAptitudeQuestions);

// POST /api/aptitude/submit
// Protected: must be logged in, checks and sets assessment_locked
router.post('/submit', requireAuth, submitAptitude);

export default router;