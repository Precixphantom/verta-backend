import express from 'express';
import { getCourseById, getUniversitiesByCourse } from '../controllers/courseController.js';

const router = express.Router();

// GET /api/courses/:id
// Returns full course profile by course ID
router.get('/:id', getCourseById);

// GET /api/courses/:id/universities
// Returns universities offering a given course, optional type filter
router.get('/:id/universities', getUniversitiesByCourse);

export default router;