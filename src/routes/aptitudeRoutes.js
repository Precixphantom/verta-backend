import express from 'express';
import { getAptitudeQuestions, submitAptitude, getAptitudeResult } from '../controllers/aptitudeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/aptitude/questions?level=JSS
router.get('/questions', getAptitudeQuestions);

// POST /api/aptitude/submit
// Protected: must be logged in, checks and sets assessment_locked
router.post('/submit', requireAuth, submitAptitude);

// GET /api/aptitude/result
// Protected: returns a locked student's saved result, retrievable anytime
router.get('/result', requireAuth, getAptitudeResult);

export default router;