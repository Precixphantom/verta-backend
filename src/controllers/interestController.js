import pool from '../config/db.js';

// Route 2: students rate activities from 1 to 5. Each track is scored on its
// own, from 0 to 100, so the three scores do NOT have to add up to 100.
// The old aptitudeController.js is untouched and stays as the fallback.

const TRACKS = ['Science', 'Commercial', 'Arts'];

// PLACEHOLDER, not validated: tracks less than this many points below the
// best score count as a close call, and the student chooses. Adjust after the pilot.
const CLOSE_MARGIN = 5;

// GET /api/aptitude/items?level=JSS|SSS
export const getInterestItems = async (req, res) => {
  try {
    const { level } = req.query;

    if (!level || !['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ error: 'Level must be JSS or SSS' });
    }

    const result = await pool.query(
      `SELECT id, track, item_text
       FROM interest_items
       WHERE level = $1
       ORDER BY display_order ASC, id ASC`,
      [level]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No items found for this level' });
    }

    const sections = TRACKS.map(track => ({
      track,
      items: result.rows
        .filter(r => r.track === track)
        .map(r => ({ id: r.id, item_text: r.item_text }))
    }));

    res.status(200).json({
      level,
      count: result.rows.length,
      scale: { min: 1, max: 5, low_label: 'Not for me', high_label: 'Love it' },
      sections
    });

  } catch (error) {
    console.error('getInterestItems error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/aptitude/submit-ratings
// Body:
// {
//   "level": "JSS" | "SSS",
//   "ratings": [{ "item_id": 1, "rating": 4 }, ...],
//   "department": "Science" | "Commercial" | "Arts",   optional, SSS only
//   "chosen_track": "Science" | "Commercial" | "Arts"   only on the SECOND
//                                                        call, for a close call
// }
export const submitInterest = async (req, res) => {
  try {
    const userId = req.userId;
    const { level, ratings, chosen_track, department } = req.body;

    // Step 1: early exit if already locked. The real guard is in Step 7.
    const userResult = await pool.query(
  'SELECT assessment_locked, department FROM users WHERE id = $1',
  [userId]
);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userResult.rows[0].assessment_locked) {
      return res.status(403).json({ error: 'This account has already completed the assessment' });
    }

    // Step 2: validate the request shape
    if (!level || !['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ error: 'Level must be JSS or SSS' });
    }
    if (!Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ error: 'Ratings must be a non empty array' });
    }

    const validShape = ratings.every(
      r =>
        r &&
        Number.isInteger(r.item_id) &&
        Number.isInteger(r.rating) &&
        r.rating >= 1 &&
        r.rating <= 5
    );
    if (!validShape) {
      return res.status(400).json({ error: 'Each rating needs an item_id and a whole number rating from 1 to 5' });
    }

    if (department !== undefined && department !== null && !TRACKS.includes(department)) {
      return res.status(400).json({ error: 'Department must be Science, Commercial or Arts' });
    }

    // Step 3: roll call. Every item for this level answered exactly once.
    const itemsResult = await pool.query(
      'SELECT id, track FROM interest_items WHERE level = $1',
      [level]
    );

    if (itemsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No items found for this level' });
    }

    const trackById = new Map(itemsResult.rows.map(r => [r.id, r.track]));
    const submittedIds = new Set(ratings.map(r => r.item_id));

    if (submittedIds.size !== ratings.length) {
      return res.status(400).json({ error: 'Each item can only be rated once' });
    }
    if (
      submittedIds.size !== trackById.size ||
      [...submittedIds].some(id => !trackById.has(id))
    ) {
      return res.status(400).json({ error: 'Rate every item for this level' });
    }

    // Step 4: score each track on its own. A rating of 1 maps to 0 and a
    // rating of 5 maps to 100, so the score does not start at 20.
    const sums = { Science: 0, Commercial: 0, Arts: 0 };
    const counts = { Science: 0, Commercial: 0, Arts: 0 };

    ratings.forEach(r => {
      const track = trackById.get(r.item_id);
      sums[track] += r.rating;
      counts[track] += 1;
    });

    const scores = {};
    TRACKS.forEach(track => {
      const n = counts[track];
      scores[track] = n > 0
        ? Number((((sums[track] - n) / (4 * n)) * 100).toFixed(1))
        : 0;
    });

    // Step 5: find the strongest track, and detect close calls
    const best = Math.max(...Object.values(scores));
    const contenders = TRACKS.filter(track => best - scores[track] < CLOSE_MARGIN);

    let finalTrack;

    if (contenders.length > 1) {
      // Close call. Ask the student to choose. Do NOT lock the account yet.
      if (!chosen_track) {
        if (level === 'SSS' && department) {
    await pool.query(
      'UPDATE users SET department = $1 WHERE id = $2 AND assessment_locked = false',
      [department, userId]
    );
  }
        return res.status(200).json({
          tie: true,
          tied_tracks: contenders,
          scores,
          message:
            contenders.length === 3
              ? 'Your ratings were very similar across all three areas. Choose the one you like most to finish.'
              : `Your scores for ${contenders.join(' and ')} are very close. Choose the one you like most to finish.`
        });
      }

      if (!contenders.includes(chosen_track)) {
        return res.status(400).json({ error: `chosen_track must be one of: ${contenders.join(', ')}` });
      }

      finalTrack = chosen_track;
    } else {
      finalTrack = contenders[0];
    }

    // Step 6: deterministic course lookup, same as before
    const coursesResult = await pool.query(
      `SELECT id, name, description FROM courses WHERE primary_track = $1 ORDER BY id ASC LIMIT 3`,
      [finalTrack]
    );

    // Step 7: atomic lock. Check and update in one step.
    const departmentToStore =
  level === 'SSS' ? (department || userResult.rows[0].department || null) : null;

    const lockResult = await pool.query(
      `UPDATE users
       SET assessment_locked = true,
           science_score = $1,
           commercial_score = $2,
           arts_score = $3,
           recommended_track = $4,
           department = COALESCE($6::varchar, department)
       WHERE id = $5 AND assessment_locked = false`,
      [scores.Science, scores.Commercial, scores.Arts, finalTrack, userId, departmentToStore]
    );

    if (lockResult.rowCount === 0) {
      return res.status(403).json({ error: 'This account has already completed the assessment' });
    }

    const matchesDepartment = departmentToStore ? departmentToStore === finalTrack : null;

    let message = `Your strongest interest area is ${finalTrack}.`;
    if (matchesDepartment === true) {
      message += ' This lines up with your department. Here are courses to explore.';
    } else if (matchesDepartment === false) {
      message += ` Your department is ${departmentToStore}. Many courses connect both areas, so explore the matches below.`;
    }

    res.status(200).json({
      tie: false,
      recommended_track: finalTrack,
      scores,
      department: departmentToStore,
      matches_department: matchesDepartment,
      top_matches: coursesResult.rows,
      message
    });

  } catch (error) {
    console.error('submitInterest error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};