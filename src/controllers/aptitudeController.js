import pool from '../config/db.js';

// Note: Gemini/Olu is intentionally NOT used in this file anymore.
// The concept note requires deterministic scoring, no AI variance, for the
// diagnostic itself. Olu still exists, untouched, in chatController.js,
// that's a separate feature (the advisory chatbot), not the scoring engine.

export const getAptitudeQuestions = async (req, res) => {
  try {
    const { level } = req.query;

    if (!level || !['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ error: 'Level must be JSS or SSS' });
    }

    const questionsResult = await pool.query(
      `SELECT id, question_text, category
       FROM aptitude_questions
       WHERE level = $1
       ORDER BY id ASC`,
      [level]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this level' });
    }

    const questionIds = questionsResult.rows.map(q => q.id);

    const optionsResult = await pool.query(
      `SELECT id, question_id, option_text
       FROM question_options
       WHERE question_id = ANY($1::int[])
       ORDER BY id ASC`,
      [questionIds]
    );

    const optionsByQuestion = {};
    optionsResult.rows.forEach(option => {
      if (!optionsByQuestion[option.question_id]) {
        optionsByQuestion[option.question_id] = [];
      }
      optionsByQuestion[option.question_id].push({
        id: option.id,
        option_text: option.option_text
      });
    });

    const questions = questionsResult.rows.map(q => ({
      id: q.id,
      question_text: q.question_text,
      category: q.category,
      options: optionsByQuestion[q.id] || []
    }));

    res.status(200).json({
      level,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error('getAptitudeQuestions error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/aptitude/submit
// Protected by requireAuth, so req.userId is always set here.
//
// Body:
// {
//   "level": "JSS" | "SSS",
//   "answers": [{ "question_id": 1, "option_id": 2 }, ...],
//   "chosen_track": "Science" | "Commercial" | "Arts"   <- only sent on the
//                                                           SECOND call, when
//                                                           resolving a tie
// }
export const submitAptitude = async (req, res) => {
  try {
    const userId = req.userId;
    const { level, answers, chosen_track } = req.body;

    // Step 1: the identity lock, early exit. The real guard is in Step 6.
    const userResult = await pool.query(
      'SELECT assessment_locked FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userResult.rows[0].assessment_locked) {
      return res.status(403).json({ error: 'This account has already completed the assessment' });
    }

    // Step 2: validation
    if (!level || !['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ error: 'Level must be JSS or SSS' });
    }
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers must be a non empty array' });
    }

    const validShape = answers.every(
      a => a && Number.isInteger(a.question_id) && Number.isInteger(a.option_id)
    );
    if (!validShape) {
      return res.status(400).json({ error: 'Each answer needs a question_id and option_id' });
    }

    // Roll call: who should have answered, and did each question get answered once?
    const expectedResult = await pool.query(
      'SELECT id FROM aptitude_questions WHERE level = $1',
      [level]
    );
    const expectedIds = new Set(expectedResult.rows.map(r => r.id));
    const submittedIds = new Set(answers.map(a => a.question_id));

    if (submittedIds.size !== answers.length) {
      return res.status(400).json({ error: 'Each question can only be answered once' });
    }
    if (
      submittedIds.size !== expectedIds.size ||
      [...submittedIds].some(id => !expectedIds.has(id))
    ) {
      return res.status(400).json({ error: 'Answer every question for this level' });
    }

    // Step 3: check each option belongs to its question, then score.
    // Deterministic weighted scoring, same math for JSS and SSS.
    const optionIds = answers.map(a => a.option_id);

    const weightsResult = await pool.query(
      `SELECT id, question_id, weight_science, weight_arts, weight_commercial
       FROM question_options
       WHERE id = ANY($1::int[])`,
      [optionIds]
    );

    const optionById = new Map(weightsResult.rows.map(o => [o.id, o]));
    const mismatch = answers.some(a => {
      const option = optionById.get(a.option_id);
      return !option || option.question_id !== a.question_id;
    });
    if (mismatch) {
      return res.status(400).json({ error: 'One or more options do not match their question' });
    }

    let scienceScore = 0;
    let artsScore = 0;
    let commercialScore = 0;

    weightsResult.rows.forEach(option => {
      scienceScore += parseFloat(option.weight_science);
      artsScore += parseFloat(option.weight_arts);
      commercialScore += parseFloat(option.weight_commercial);
    });

    const totalScore = scienceScore + artsScore + commercialScore;

    const scores = {
      Science: totalScore > 0 ? Number(((scienceScore / totalScore) * 100).toFixed(1)) : 0,
      Commercial: totalScore > 0 ? Number(((commercialScore / totalScore) * 100).toFixed(1)) : 0,
      Arts: totalScore > 0 ? Number(((artsScore / totalScore) * 100).toFixed(1)) : 0,
    };

    // Step 4: find the winning track, and detect ties
    const maxScore = Math.max(...Object.values(scores));
    const tiedTracks = Object.keys(scores).filter(track => scores[track] === maxScore);

    let finalTrack;

    if (tiedTracks.length > 1) {
      // Genuine tie. If the student hasn't told us which one they want yet,
      // stop here and ask. Do NOT lock the account, nothing has been decided.
      if (!chosen_track) {
        return res.status(200).json({
          tie: true,
          tied_tracks: tiedTracks,
          scores,
          message: `You scored equally in ${tiedTracks.join(' and ')}. Submit again with chosen_track set to one of these to finish.`
        });
      }

      // They came back with a choice. It must be one of the tracks that
      // actually tied, they can't pick a track they didn't tie in.
      if (!tiedTracks.includes(chosen_track)) {
        return res.status(400).json({ error: `chosen_track must be one of: ${tiedTracks.join(', ')}` });
      }

      finalTrack = chosen_track;
    } else {
      finalTrack = tiedTracks[0];
    }

    // Step 5: look up real courses for the winning track, deterministically,
    // not an AI guess. Ordered by id so the same track always returns the
    // same 3 courses, no randomness.
    const coursesResult = await pool.query(
      `SELECT id, name, description FROM courses WHERE primary_track = $1 ORDER BY id ASC LIMIT 3`,
      [finalTrack]
    );

    // Step 6: atomic lock. The WHERE clause makes the check and the update
    // one step, so two simultaneous requests cannot both succeed.
    const lockResult = await pool.query(
      `UPDATE users
       SET assessment_locked = true,
           science_score = $1,
           commercial_score = $2,
           arts_score = $3,
           recommended_track = $4
       WHERE id = $5 AND assessment_locked = false`,
      [scores.Science, scores.Commercial, scores.Arts, finalTrack, userId]
    );

    if (lockResult.rowCount === 0) {
      return res.status(403).json({ error: 'This account has already completed the assessment' });
    }

    res.status(200).json({
      tie: false,
      recommended_track: finalTrack,
      scores,
      top_matches: coursesResult.rows,
      message: `Based on your answers, you are best suited for the ${finalTrack} track.`
    });

  } catch (error) {
    console.error('submitAptitude error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/aptitude/result
// Protected by requireAuth. Lets a student who already completed the
// assessment retrieve their result again later, since /submit only ever
// returned it once, at the moment of submission.
export const getAptitudeResult = async (req, res) => {
  try {
    const userId = req.userId;

    const userResult = await pool.query(
      `SELECT assessment_locked, science_score, commercial_score, arts_score,
              recommended_track, department
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.assessment_locked) {
      return res.status(404).json({ error: 'This account has not completed the assessment yet' });
    }

    const coursesResult = await pool.query(
      `SELECT id, name, description FROM courses WHERE primary_track = $1 ORDER BY id ASC LIMIT 3`,
      [user.recommended_track]
    );

    const matchesDepartment = user.department
      ? user.department === user.recommended_track
      : null;

    let message = `Your strongest interest area is ${user.recommended_track}.`;
    if (matchesDepartment === true) {
      message += ' This lines up with your department. Here are courses to explore.';
    } else if (matchesDepartment === false) {
      message += ` Your department is ${user.department}. Many courses connect both areas, so explore the matches below.`;
    }

    res.status(200).json({
      recommended_track: user.recommended_track,
      scores: {
        Science: Number(user.science_score),
        Commercial: Number(user.commercial_score),
        Arts: Number(user.arts_score),
      },
      department: user.department,
      matches_department: matchesDepartment,
      top_matches: coursesResult.rows,
      message
    });

  } catch (error) {
    console.error('getAptitudeResult error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};