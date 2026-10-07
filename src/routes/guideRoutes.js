import express from 'express'; // the router lives in Express
import { getRoadmap, getSkills } from '../controllers/guideController.js'; // the two handlers

const router = express.Router(); // a mini app for these two routes

router.get('/roadmap', getRoadmap); // GET /api/roadmap once mounted at /api
router.get('/skills', getSkills); // GET /api/skills once mounted at /api

export default router; // so app.js can mount it