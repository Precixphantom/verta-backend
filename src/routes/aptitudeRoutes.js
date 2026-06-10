import express from 'express';
import { getAptitudeResult, getAptitudeQuestions } from '../controllers/aptitudeController.js';

const router = express.Router();

// POST /api/aptitude/result
// Accepts student level and answers, returns department or course recommendation
router.post('/result', getAptitudeResult);

// GET /api/aptitude/questions?level=SSS
// Returns all questions and options for a given level
router.get('/questions', getAptitudeQuestions);


export default router;