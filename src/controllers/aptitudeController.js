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

    // Step 1: the identity lock. This is the whole point of today's task.
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

    // Step 2: validation, same as before
    if (!level || !['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ error: 'Level must be JSS or SSS' });
    }
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers must be a non-empty array' });
    }

    // Step 3: deterministic weighted scoring, same math for JSS and SSS,
    // no branching by level anymore.
    const optionIds = answers.map(a => a.option_id);

    const weightsResult = await pool.query(
      `SELECT id, weight_science, weight_arts, weight_commercial
       FROM question_options
       WHERE id = ANY($1::int[])`,
      [optionIds]
    );

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
      // stop here and ask, do NOT lock the account, nothing has been decided.
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

    // Step 6: lock the account and save the result. This can only happen once,
    // enforced by the check at the top of this function.
    await pool.query(
      `UPDATE users
       SET assessment_locked = true,
           science_score = $1,
           commercial_score = $2,
           arts_score = $3,
           recommended_track = $4
       WHERE id = $5`,
      [scores.Science, scores.Commercial, scores.Arts, finalTrack, userId]
    );

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