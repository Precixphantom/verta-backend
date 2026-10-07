import express from 'express'; // the router lives in Express
import { getTrackContent } from '../controllers/trackController.js'; // the function that answers the request

const router = express.Router(); // a mini app that holds only the track routes

// GET /api/tracks/:track
router.get('/:track', getTrackContent); // :track becomes req.params.track in the controller

export default router; // so app.js can mount it